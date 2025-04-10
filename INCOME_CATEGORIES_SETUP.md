
# Income Categories Setup

This guide will help you update your database to support income transactions with categories.

## Database Updates

The application already has support for income transactions with categories in the frontend code, but your database needs to be updated to ensure the categories table has the proper structure.

### 1. Run the SQL script in Supabase

1. Log into your Supabase dashboard
2. Go to the SQL Editor
3. Create a new query
4. Copy and paste the following SQL:

```sql
-- Update categories table to ensure it has type column for income/expense categories
DO $$
BEGIN
    -- Check if type column exists in categories table
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'categories' 
        AND column_name = 'type'
    ) THEN
        -- Add type column with default value 'expense'
        ALTER TABLE categories ADD COLUMN type TEXT DEFAULT 'expense';
        
        -- Add check constraint to limit values
        ALTER TABLE categories ADD CONSTRAINT categories_type_check 
            CHECK (type IN ('income', 'expense', 'both'));
        
        -- Set existing categories with known income-related names to 'income' type
        UPDATE categories 
        SET type = 'income' 
        WHERE name ILIKE ANY(ARRAY['salary', 'income', 'freelance', 'investments', 'gifts', 'refunds']);
        
        -- Set some categories to 'both' if they could be either
        UPDATE categories 
        SET type = 'both' 
        WHERE name ILIKE ANY(ARRAY['transfer', 'other']);
        
        RAISE NOTICE 'Added type column to categories table';
    END IF;
    
    -- Check if is_active column exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'categories' 
        AND column_name = 'is_active'
    ) THEN
        -- Add is_active column with default value true
        ALTER TABLE categories ADD COLUMN is_active BOOLEAN DEFAULT true;
        RAISE NOTICE 'Added is_active column to categories table';
    END IF;
END $$;
```

5. Run the query

This script will:
- Add a 'type' column to the categories table (if it doesn't already exist)
- Set appropriate categories to 'income', 'expense', or 'both'
- Add an 'is_active' column (if it doesn't already exist)

### 2. Create Default Categories

If your categories table is empty, you can create default categories by:

1. Go to the Transactions page in your application
2. The application will automatically create default categories for both income and expense if none exist

## Using Income Transactions with Categories

After updating your database, you can now:

1. Add income transactions with appropriate categories
2. When creating a transaction, select "Income" as the type
3. The category dropdown will automatically filter to show only income categories and both-type categories
4. You can also create new income categories on the fly while adding transactions

## Troubleshooting

If categories don't show up properly:
1. Make sure the SQL script ran successfully
2. Try refreshing the application
3. Check the browser console for any errors
4. Verify in the Supabase database that the categories table has the correct structure 