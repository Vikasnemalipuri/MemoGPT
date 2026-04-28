const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')

const envFile = fs.readFileSync('.env.local', 'utf8')
let url = ''
let key = ''

for (const line of envFile.split('\n')) {
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) url = line.split('=')[1].trim()
  if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) key = line.split('=')[1].trim()
}

if (!url || !key || url.includes('your-project')) {
  console.error('Invalid Supabase URL or Service Role Key in .env.local')
  process.exit(1)
}

const supabaseAdmin = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false }
})

async function createDemoUser() {
  console.log(`Creating demo user at ${url}...`)
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email: 'demo@memogpt.ai',
    password: 'demo123456',
    email_confirm: true,
    user_metadata: { full_name: 'Demo User' }
  })
  if (error) {
    if (error.message.includes('already been registered') || error.message.includes('User already registered')) {
      console.log('Demo user already exists. It should be working now!')
    } else {
      console.error('Error creating user:', error.message)
    }
  } else {
    console.log('Success! Demo user created. You can now use the "Try Demo Account" button.')
  }
}
createDemoUser()
