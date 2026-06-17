using System;
using API.Data;
using API.DTOs;
using API.Entities.OrderAggregate;
using API.Extensions;
using API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Stripe;

namespace API.Controllers;

public class PaymentsController(
    PaymentsService paymentsService,
    StoreContext context,
    IConfiguration config,
    ILogger<PaymentsController> logger) : BaseApiController
{
    [Authorize]
    [HttpPost]
    public async Task<ActionResult<BasketDto>> CreateOrUpdatePaymentIntent()
    {

        var basket = await context.Baskets.GetBasketWithItems(Request.Cookies["basketId"]); //basket
        if (basket == null) return BadRequest("Problem with the basket");

        var intent = await paymentsService.CreateOrUpdatePaymentIntent(basket); //intent
        if (intent == null) return BadRequest("Problem creating payment intent");

        basket.PaymentIntentId ??= intent.Id;
        basket.ClientSecret ??= intent.ClientSecret;

        if (context.ChangeTracker.HasChanges())
        {
            var result = await context.SaveChangesAsync() > 0;
            if (!result) return BadRequest("Problem updating basket with intent");
        }

        return basket.ToDto();

    }

    [HttpPost("webhook")]
    [IgnoreAntiforgeryToken]
    public async Task<IActionResult> StripeWebhook()
    {
        // Important: Read the raw body BEFORE anything else
        Request.EnableBuffering(); // Allows re-reading the body if needed
        var json = await new StreamReader(Request.Body).ReadToEndAsync();
        Request.Body.Position = 0; // Reset for any other middleware

        try
        {
            var stripeEvent = ConstructStripeEvent(json);

            if (stripeEvent?.Data?.Object is not PaymentIntent intent)
            {
                logger.LogWarning("Received event without PaymentIntent data");
                return BadRequest("Invalid event data");
            }

            if (stripeEvent.Type == EventTypes.PaymentIntentSucceeded)
            {
                await HandlePaymentIntentSucceeded(intent);
            }
            else if (stripeEvent.Type == EventTypes.PaymentIntentPaymentFailed)
            {
                await HandlePaymentIntentFailed(intent);
            }

            return Ok();
        }
        catch (StripeException ex) when (ex.Message.Contains("signature", StringComparison.OrdinalIgnoreCase))
        {
            logger.LogError(ex, "Stripe signature verification failed");
            return BadRequest("Invalid signature");   // ← Stripe prefers 400 for bad signatures
        }
        catch (StripeException ex)
        {
            logger.LogError(ex, "Stripe webhook error");
            return StatusCode(500, "Webhook error");
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Unexpected error in webhook");
            return StatusCode(500, "Unexpected error");
        }
    }

    private async Task HandlePaymentIntentFailed(PaymentIntent intent)
    {
        var order = await context.Orders
            .Include(x => x.OrderItems)
            .FirstOrDefaultAsync(x => x.PaymentIntentId == intent.Id)
                ?? throw new Exception("Order not found");

        foreach (var item in order.OrderItems)
        {
            var productItem = await context.Products
                .FindAsync(item.ItemOrdered.ProductId)
                    ?? throw new Exception("Problem updating order stock");

            productItem.QuantityInStock += item.Quantity;
        }

        order.OrderStatus = OrderStatus.PaymentFailed;

        await context.SaveChangesAsync();
    }

    private async Task HandlePaymentIntentSucceeded(PaymentIntent intent)
    {
        var order = await context.Orders
           .Include(x => x.OrderItems)
           .FirstOrDefaultAsync(x => x.PaymentIntentId == intent.Id)
               ?? throw new Exception("Order not found");

        if (order.GetTotal() != intent.Amount)
        {
            order.OrderStatus = OrderStatus.PaymentMismatch;
        }
        else
        {
            order.OrderStatus = OrderStatus.PaymentReceived;
        }

        var basket = await context.Baskets.FirstOrDefaultAsync(x =>
            x.PaymentIntentId == intent.Id);

        if (basket != null) context.Baskets.Remove(basket);

        await context.SaveChangesAsync();
    }

    private Event ConstructStripeEvent(string json)
    {
        try
        {
            return EventUtility.ConstructEvent(
                json,
                Request.Headers["Stripe-Signature"].ToString(),
                config["StripeSettings:WhSecret"],
                throwOnApiVersionMismatch: false);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to construct stripe event");
            throw new StripeException("Invalid signature");
        }
    }

}
