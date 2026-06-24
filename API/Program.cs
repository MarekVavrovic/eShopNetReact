using API.Data;
using API.Entities;
using API.Middleware;
using API.RequestHelpers;
using API.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.Configure<CloudinarySettings>(builder.Configuration.GetSection("Cloudinary"));
builder.Services.AddControllers();
builder.Services.AddDbContext<StoreContext>(opt => 
{
     opt.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection"));
});
builder.Services.AddAutoMapper(AppDomain.CurrentDomain.GetAssemblies());
builder.Services.AddCors();
builder.Services.AddTransient<ExceptionMiddleware>(); 
builder.Services.AddScoped<PaymentsService>(); //Stripe
builder.Services.AddScoped<ImageService>(); //Cloudinary
builder.Services.AddIdentityApiEndpoints<User>(opt => //Identity Service
{
    opt.User.RequireUniqueEmail = true;
})
    .AddRoles<IdentityRole>()
    .AddEntityFrameworkStores<StoreContext>();

var app = builder.Build();

// Configure the HTTP request pipeline.
app.UseMiddleware<ExceptionMiddleware>(); //adding Middleware

//use static files - client
app.UseDefaultFiles();
app.UseStaticFiles();


app.UseDeveloperExceptionPage();

app.UseRouting();

app.UseCors(opt => 
{
    opt.AllowAnyHeader().AllowAnyMethod().AllowCredentials().WithOrigins("https://localhost:3000");
});

//identity middleware
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapGroup("api").MapIdentityApi<User>(); // api/login
app.MapFallbackToController("Index", "Fallback");

await DbInitializer.InitDb(app);

app.Run();
