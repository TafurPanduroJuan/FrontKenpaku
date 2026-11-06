import { apiClient } from './client';

export async function createQuote(payload) {
  const { data } = await apiClient.post('/quotes', payload);
  return data;
}

export async function getQuote(codigo) {
  const { data } = await apiClient.get(`/quotes/${encodeURIComponent(codigo)}`);
  return data;
}

export async function chooseQuoteItem(codigo, itemId, productId) {
  const { data } = await apiClient.patch(
    `/quotes/${encodeURIComponent(codigo)}/items/${itemId}`,
    { product_id: productId }
  );
  return data;
}

export async function recalculateQuote(codigo) {
  const { data } = await apiClient.post(`/quotes/${encodeURIComponent(codigo)}/recalculate`);
  return data;
}