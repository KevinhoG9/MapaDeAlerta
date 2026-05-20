# 🗺️ Configuração do Mapbox

## Passo a passo (5 minutos, gratuito)

1. Acesse **https://account.mapbox.com/auth/signup/** e crie uma conta gratuita
2. Após login, vá em **https://account.mapbox.com/** → copie o **Default public token**
3. No arquivo `src/components/map-view.tsx`, substitua o token na linha:

```ts
mapboxgl.accessToken = 'SEU_TOKEN_AQUI';
```

## Plano gratuito
- **50.000 loads/mês** — mais que suficiente para a apresentação e testes
- Sem necessidade de cartão de crédito para o plano free

## Estilos usados
- **Claro:** `mapbox://styles/mapbox/outdoors-v12` (verde, topográfico)
- **Escuro:** `mapbox://styles/mapbox/dark-v11` (dark elegante nativo)
