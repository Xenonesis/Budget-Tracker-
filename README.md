# Budget Tracker App by Aditya

A fully responsive budget tracking application built with Next.js, React, ShadCN UI, and Supabase.

## Version 5.0 - Latest Updates

**Released: March 30, 2024**

### New Features
- Added notification preferences for budget alerts and transaction confirmations
- Implemented timezone selection in user profile settings
- Enhanced transaction categories with custom user-defined categories
- Added phone number verification for account security
- Improved recurring transactions with customizable schedules and more options

### User Experience Improvements
- Redesigned dashboard with more intuitive navigation
- Optimized mobile experience with better touch controls
- Added keyboard shortcuts for common actions
- Improved accessibility throughout the application
- Enhanced error handling with more informative messages

### Technical Improvements
- Updated Next.js to version 14.2.26
- Improved database performance with optimized queries
- Enhanced security with additional validation checks
- Reduced bundle size for faster loading times
- Added comprehensive error logging

## Version 4.0

**Released: March 30, 2023**

### New Features
- Enhanced transaction filtering and sorting capabilities
- Added PDF, CSV, and Excel export functionality for transactions
- Implemented scheduled exports with multiple frequency options
- Improved transaction form with autosave and suggestions
- **Added theme toggle functionality for easy switching between light, dark, and system themes**

### User Experience Improvements
- Fixed dropdown duplication issues in custom category forms
- Added virtual scrolling for better performance with large transaction lists
- Improved timezone handling across all date operations
- Enhanced mobile responsiveness throughout the application
- **Added accessible theme toggles to all key pages (landing, dashboard, profile)**

### Bug Fixes
- Resolved transaction creation failures with reliable insertion function
- Fixed currency display issues in dark mode
- Corrected recurring transaction generation logic
- Improved state management with better error handling

## Important: Environment Setup Required

**Before building or deploying this project:**

1. Create a `.env.local` file in the root directory with your Supabase credentials:
```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

2. You can use the provided `.env.template` file as a reference.

3. These environment variables are required for the application to function properly. Without them, the build will fail.

![Budget Tracker App](https://i.imgur.com/placeholder-image.png)

## Features

- **User Authentication**: Secure login and registration with Supabase Auth
- **Transaction Management**: Add, edit, and delete income and expense transactions
- **Budget Planning**: Set and monitor spending limits by category
- **Data Visualization**: Track financial patterns with charts and reports
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Dark Mode Support**: Switch between light and dark themes
- **Data Security**: Built-in row-level security ensures users can only access their own data

## Tech Stack

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS
- **UI Components**: ShadCN UI
- **Backend & Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Charts & Visualization**: Recharts
- **State Management**: React Context API, Zustand
- **Styling**: Tailwind CSS with CSS variables for theming

## Getting Started

### Prerequisites

- Node.js (v18 or newer)
- npm or yarn
- Supabase account

### Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/budget-tracker.git
cd budget-tracker
```

2. Install dependencies:

```bash
npm install
# or
yarn install
```

3. Set up environment variables:

Create a `.env.local` file in the root directory with your Supabase credentials:

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

4. Run the development server:

```bash
npm run dev
# or
yarn dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Setting up Supabase

1. Create a new Supabase project
2. Run the database schema setup (see SQL setup below)
3. Configure authentication providers
4. Set up row-level security policies

#### Supabase Schema Setup

```sql
-- Users table is handled by Supabase Auth

-- Create profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT,
  currency TEXT DEFAULT 'USD',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create transactions table
CREATE TABLE transactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  amount NUMERIC NOT NULL,
  type TEXT CHECK (type IN ('income', 'expense')) NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create budgets table
CREATE TABLE budgets (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  category TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  period TEXT CHECK (period IN ('weekly', 'monthly', 'yearly')) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Set up row-level security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own profile" 
  ON profiles FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
  ON profiles FOR UPDATE 
  USING (auth.uid() = id);

CREATE POLICY "Users can view their own transactions" 
  ON transactions FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own transactions" 
  ON transactions FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own transactions" 
  ON transactions FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own transactions" 
  ON transactions FOR DELETE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own budgets" 
  ON budgets FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own budgets" 
  ON budgets FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own budgets" 
  ON budgets FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own budgets" 
  ON budgets FOR DELETE 
  USING (auth.uid() = user_id);

-- Create triggers for new user creation
CREATE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
```

## Database Setup

To fix the "Failed to save transaction" error, run these SQL commands in your Supabase SQL Editor:

```sql
-- COMPLETE DATABASE SETUP SCRIPT (FIXED SYNTAX ERROR)
-- This script addresses all potential issues including enum type problems

-- STEP 1: CREATE OR MODIFY TABLES
-- First, handle the transaction_type enum
DO $$
BEGIN
  -- Check if enum exists
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'transaction_type') THEN
    -- Try to add missing values to existing enum
    BEGIN
      ALTER TYPE transaction_type ADD VALUE IF NOT EXISTS 'income';
      RAISE NOTICE 'Added income to transaction_type enum';
    EXCEPTION WHEN duplicate_object THEN NULL; END;
    
    BEGIN
      ALTER TYPE transaction_type ADD VALUE IF NOT EXISTS 'expense';
      RAISE NOTICE 'Added expense to transaction_type enum';
    EXCEPTION WHEN duplicate_object THEN NULL; END;
  ELSE
    -- Create the enum if it doesn't exist
    CREATE TYPE transaction_type AS ENUM ('income', 'expense');
    RAISE NOTICE 'Created transaction_type enum';
  END IF;
END $$;

-- STEP 2: CREATE OR UPDATE TABLES
-- Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  name TEXT,
  currency TEXT DEFAULT 'USD',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Handle transactions table with type enum
DO $$
BEGIN
  -- Check if transactions table exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'transactions') THEN
    -- Create transactions table using the enum type
    CREATE TABLE transactions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
      type transaction_type NOT NULL DEFAULT 'expense',
      category TEXT NOT NULL,
      amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
      description TEXT,
      date DATE NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    RAISE NOTICE 'Created transactions table';
  ELSE
    -- Table exists, check columns and modify if needed
    -- First check if type column exists
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_schema = 'public' 
               AND table_name = 'transactions' 
               AND column_name = 'type') THEN
      
      -- Check if it's using the enum type
      IF NOT (SELECT data_type = 'USER-DEFINED' AND udt_name = 'transaction_type'
              FROM information_schema.columns 
              WHERE table_schema = 'public' 
              AND table_name = 'transactions' 
              AND column_name = 'type') THEN
        -- Convert column to enum type
        ALTER TABLE transactions ALTER COLUMN type DROP DEFAULT;
        ALTER TABLE transactions ALTER COLUMN type TYPE transaction_type USING 
          CASE 
            WHEN type = 'income' THEN 'income'::transaction_type 
            WHEN type = 'expense' THEN 'expense'::transaction_type
            ELSE 'expense'::transaction_type
          END;
        ALTER TABLE transactions ALTER COLUMN type SET DEFAULT 'expense'::transaction_type;
        RAISE NOTICE 'Converted type column to enum type';
      END IF;
    ELSE
      -- Add type column if missing
      ALTER TABLE transactions ADD COLUMN type transaction_type NOT NULL DEFAULT 'expense'::transaction_type;
      RAISE NOTICE 'Added type column to transactions table';
    END IF;
    
    -- Check other columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'transactions' 
                   AND column_name = 'category') THEN
      ALTER TABLE transactions ADD COLUMN category TEXT NOT NULL DEFAULT 'Uncategorized';
      RAISE NOTICE 'Added category column to transactions table';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'transactions' 
                   AND column_name = 'amount') THEN
      ALTER TABLE transactions ADD COLUMN amount DECIMAL(10, 2) NOT NULL DEFAULT 0.01;
      RAISE NOTICE 'Added amount column to transactions table';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'transactions' 
                   AND column_name = 'description') THEN
      ALTER TABLE transactions ADD COLUMN description TEXT;
      RAISE NOTICE 'Added description column to transactions table';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'transactions' 
                   AND column_name = 'date') THEN
      ALTER TABLE transactions ADD COLUMN date DATE NOT NULL DEFAULT CURRENT_DATE;
      RAISE NOTICE 'Added date column to transactions table';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'transactions' 
                   AND column_name = 'user_id') THEN
      ALTER TABLE transactions ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
      RAISE NOTICE 'Added user_id column to transactions table';
    END IF;
  END IF;
END $$;

-- Create budgets table if it doesn't exist
CREATE TABLE IF NOT EXISTS budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  category TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
  month DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- STEP 3: ENABLE ROW LEVEL SECURITY
DO $$ 
BEGIN
  -- Enable RLS on profiles
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') THEN
    ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE 'Enabled RLS on profiles table';
  END IF;
  
  -- Enable RLS on transactions
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'transactions') THEN
    ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE 'Enabled RLS on transactions table';
  END IF;
  
  -- Enable RLS on budgets
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'budgets') THEN
    ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE 'Enabled RLS on budgets table';
  END IF;
END $$;

-- STEP 4: CREATE SECURITY POLICIES (DROP AND RECREATE TO AVOID CONFLICTS)
-- Profiles policies
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') THEN
    -- Drop existing policies
    DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
    DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
    
    -- Create policies
    CREATE POLICY "Users can view their own profile" 
      ON profiles FOR SELECT 
      USING (auth.uid() = id);
      
    CREATE POLICY "Users can update their own profile" 
      ON profiles FOR UPDATE 
      USING (auth.uid() = id);
      
    RAISE NOTICE 'Created policies for profiles table';
  END IF;
END $$;

-- Transactions policies
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'transactions') THEN
    -- Drop existing policies
    DROP POLICY IF EXISTS "Users can view their own transactions" ON transactions;
    DROP POLICY IF EXISTS "Users can insert their own transactions" ON transactions;
    DROP POLICY IF EXISTS "Users can update their own transactions" ON transactions;
    DROP POLICY IF EXISTS "Users can delete their own transactions" ON transactions;
    
    -- Create policies
    CREATE POLICY "Users can view their own transactions" 
      ON transactions FOR SELECT 
      USING (auth.uid() = user_id);
      
    CREATE POLICY "Users can insert their own transactions" 
      ON transactions FOR INSERT 
      WITH CHECK (auth.uid() = user_id);
      
    CREATE POLICY "Users can update their own transactions" 
      ON transactions FOR UPDATE 
      USING (auth.uid() = user_id);
      
    CREATE POLICY "Users can delete their own transactions" 
      ON transactions FOR DELETE 
      USING (auth.uid() = user_id);
      
    RAISE NOTICE 'Created policies for transactions table';
  END IF;
END $$;

-- Budgets policies
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'budgets') THEN
    -- Drop existing policies
    DROP POLICY IF EXISTS "Users can view their own budgets" ON budgets;
    DROP POLICY IF EXISTS "Users can insert their own budgets" ON budgets;
    DROP POLICY IF EXISTS "Users can update their own budgets" ON budgets;
    DROP POLICY IF EXISTS "Users can delete their own budgets" ON budgets;
    
    -- Create policies
    CREATE POLICY "Users can view their own budgets" 
      ON budgets FOR SELECT 
      USING (auth.uid() = user_id);
      
    CREATE POLICY "Users can insert their own budgets" 
      ON budgets FOR INSERT 
      WITH CHECK (auth.uid() = user_id);
      
    CREATE POLICY "Users can update their own budgets" 
      ON budgets FOR UPDATE 
      USING (auth.uid() = user_id);
      
    CREATE POLICY "Users can delete their own budgets" 
      ON budgets FOR DELETE 
      USING (auth.uid() = user_id);
      
    RAISE NOTICE 'Created policies for budgets table';
  END IF;
END $$;

-- STEP 5: Force a schema cache refresh
DO $$
BEGIN
  PERFORM pg_notify('pgrst', 'reload schema');
  RAISE NOTICE 'Schema cache refreshed';
END $$;
```

## Deployment

This application can be deployed to Vercel:

1. Push your code to GitHub
2. Import the project to Vercel
3. Add environment variables
4. Deploy

## License

This project is licensed under the MIT License - see the LICENSE file for details. # Budget-Tracker-
