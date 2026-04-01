#!/bin/bash

# Generar archivo .env temporal para que el build no falle
echo "NEXT_PUBLIC_SUPABASE_URL=https://dummy.supabase.co" > .env
echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=dummy_key_dummy_key_dummy_key_dummy_key" >> .env

# Ejecutar el build y deploy de OpenNext
npm run deploy

# Limpiar archivo temporal
rm .env

echo "¡Despliegue exitoso! Recuerda ir al panel de Cloudflare y configurar tus variables de entorno reales en el Worker."
