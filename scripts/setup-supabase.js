#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function main() {
  console.log('🚀 Configuración de Supabase para Kolearning');
  console.log('=============================================\n');

  console.log('Este script te ayudará a configurar Supabase paso a paso.\n');

  // Check if .env file exists
  const envPath = path.join(process.cwd(), '.env');
  let envContent = '';
  
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
    console.log('✓ Archivo .env encontrado\n');
  } else {
    console.log('⚠️  No se encontró archivo .env. Se creará uno nuevo.\n');
  }

  // Get Supabase credentials
  console.log('1. Configura las credenciales de Supabase');
  console.log('   (Obtén estas desde tu proyecto en supabase.com > Settings > API)\n');

  const supabaseUrl = await question('   Project URL: ');
  const supabaseAnonKey = await question('   Anon public key: ');
  const supabaseServiceKey = await question('   Service role key (opcional): ');

  // Validate inputs
  if (!supabaseUrl || !supabaseAnonKey) {
    console.log('\n❌ URL y anon key son obligatorios. Terminando configuración.');
    rl.close();
    return;
  }

  // Update environment variables
  let newEnvContent = envContent;

  // Update or add Supabase variables
  const envVars = {
    'NEXT_PUBLIC_SUPABASE_URL': supabaseUrl,
    'NEXT_PUBLIC_SUPABASE_ANON_KEY': supabaseAnonKey,
  };

  if (supabaseServiceKey) {
    envVars['SUPABASE_SERVICE_ROLE_KEY'] = supabaseServiceKey;
  }

  Object.entries(envVars).forEach(([key, value]) => {
    const regex = new RegExp(`^${key}=.*$`, 'm');
    if (newEnvContent.match(regex)) {
      newEnvContent = newEnvContent.replace(regex, `${key}=${value}`);
    } else {
      newEnvContent += `\n${key}=${value}`;
    }
  });

  // Write .env file
  fs.writeFileSync(envPath, newEnvContent.trim() + '\n');
  console.log('\n✓ Variables de entorno actualizadas en .env');

  // Next steps
  console.log('\n2. Próximos pasos:');
  console.log('   ────────────────');
  console.log('   a) Ve a tu proyecto en supabase.com');
  console.log('   b) Abre el SQL Editor');
  console.log('   c) Copia y ejecuta el contenido de database/schema.sql');
  console.log('   d) Reinicia tu servidor de desarrollo: npm run dev');
  console.log('   e) Ve a /signup para crear tu primera cuenta\n');

  console.log('3. Configuración opcional de Google OAuth:');
  console.log('   ──────────────────────────────────────────');
  console.log('   • En Supabase: Authentication > Settings > Auth Providers');
  console.log('   • Habilita Google y configura las credenciales OAuth');
  console.log('   • URL de redirección: https://tu-proyecto.supabase.co/auth/v1/callback\n');

  console.log('4. Migración de datos existentes:');
  console.log('   ──────────────────────────────────');
  console.log('   • Si tienes datos guardados localmente, ve a /migrate después del login');
  console.log('   • La migración se ejecutará automáticamente\n');

  console.log('🎉 ¡Configuración completada!');
  console.log('   Kolearning está listo para usar Supabase como base de datos.');

  rl.close();
}

main().catch(console.error);