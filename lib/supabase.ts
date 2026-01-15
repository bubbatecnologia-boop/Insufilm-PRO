
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://udkwbeahwkuusbjtzzjc.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVka3diZWFod2t1dXNianR6empjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg1MDU3NTYsImV4cCI6MjA4NDA4MTc1Nn0.DK_BJXKPcIie1fV9Gn4gq027z4ky6Sm-2G4AK0IQbLk'

export const supabase = createClient(supabaseUrl, supabaseKey)
