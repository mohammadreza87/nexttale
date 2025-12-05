/*
  # Auto-upgrade specific emails to Pro

  1. New Table
    - `auto_pro_emails` - stores email addresses that should automatically get pro access
  
  2. Security
    - Enable RLS
    - Only service role can manage this table
    
  3. Trigger
    - Automatically upgrade users with matching emails to pro when they sign up
*/

CREATE TABLE IF NOT EXISTS auto_pro_emails (
  email text PRIMARY KEY,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE auto_pro_emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only service role can access auto_pro_emails"
  ON auto_pro_emails
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

INSERT INTO auto_pro_emails (email) VALUES
  ('erfan.sheikhhoseini@gmail.com'),
  ('masud.afsar@gmail.com')
ON CONFLICT (email) DO NOTHING;

CREATE OR REPLACE FUNCTION auto_upgrade_pro_users()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM auto_pro_emails WHERE email = NEW.email) THEN
    UPDATE user_profiles
    SET 
      subscription_tier = 'pro',
      subscription_status = 'active',
      is_grandfathered = true
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS upgrade_pro_on_signup ON auth.users;
CREATE TRIGGER upgrade_pro_on_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION auto_upgrade_pro_users();