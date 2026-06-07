import { useParams } from "react-router-dom";
import {
  Button,
  Divider,
  Grid2,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { useFetchProductsDetailsQuery } from "./catalogApi";
import {
  useAddBasketItemMutation,
  useFetchBasketQuery,
  useRemoveBasketItemMutation,
} from "../basket/basketApi";
import { useEffect, useRef, useState, type ChangeEvent } from "react";

export default function ProductDetails() {
  const { id } = useParams();
  const { data: product, isLoading } = useFetchProductsDetailsQuery(
    id ? parseInt(id) : 0,
  );

  const [removeBasketItem] = useRemoveBasketItemMutation();
  const [addBasketItem] = useAddBasketItemMutation();
  const { data: basket } = useFetchBasketQuery();
  const item = basket?.items.find((x) => x.productId === +id!);
  const [quantity, setQuantity] = useState(0);
  const prevQuantityRef = useRef<number>(0);

  useEffect(() => {
    const newQuantity = item?.quantity ?? 0;

    if (newQuantity !== prevQuantityRef.current) {
      setQuantity(newQuantity);
      prevQuantityRef.current = newQuantity;
    }
  }, [item?.quantity]);

  if (isLoading || !product) return <div>Loading...</div>;

  const handleUpdateBasket = () => {
    const updatedQuantity = item
      ? Math.abs(quantity - item.quantity)
      : quantity;

    if (!item || quantity > item.quantity) {
      addBasketItem({ product, quantity: updatedQuantity });
    } else {
      removeBasketItem({ productId: product.id, quantity: updatedQuantity });
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.currentTarget.value;
    if (value === "") {
      setQuantity(0);
      return;
    }
    const num = parseInt(value, 10);
    if (!isNaN(num) && num >= 0) {
      setQuantity(num);
    }
  };

  const productDetails = [
    { label: "Name", value: product.name },
    { label: "Description", value: product.description },
    { label: "Type", value: product.type },
    { label: "Brand", value: product.brand },
    { label: "Quantity in stock", value: product.quantityInStock },
  ];

  return (
    <Grid2 container spacing={6} maxWidth="lg" sx={{ mx: "auto" }}>
      <Grid2 size={6}>
        <img
          src={product?.pictureUrl}
          alt={product.name}
          style={{ width: "100%" }}
        />
      </Grid2>
      <Grid2 size={6}>
        <Typography variant="h3">{product.name}</Typography>
        <Divider sx={{ mb: 2 }} />
        <Typography variant="h4" color="secondary">
          ${(product.price / 100).toFixed(2)}
        </Typography>
        <TableContainer>
          <Table
            sx={{
              "& td": { fontSize: "1rem" },
            }}
          >
            <TableBody>
              {productDetails.map((detail, index) => (
                <TableRow key={index}>
                  <TableCell sx={{ fontWeight: "bold" }}>
                    {detail.label}
                  </TableCell>
                  <TableCell>{detail.value}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <Grid2 container spacing={2} marginTop={3}>
          <Grid2 size={6}>
            <TextField
              variant="outlined"
              type="number"
              label="Quantity in basket"
              fullWidth
              value={quantity}
              onChange={handleInputChange}
            />
          </Grid2>
          <Grid2 size={6}>
            <Button
              onClick={handleUpdateBasket}
              disabled={
                quantity === item?.quantity || (!item && quantity === 0)
              }
              sx={{ height: "55px" }}
              color="primary"
              size="large"
              variant="contained"
              fullWidth
            >
              {item ? "Update quantity" : "Add to basket"}
            </Button>
          </Grid2>
        </Grid2>
      </Grid2>
    </Grid2>
  );
}
