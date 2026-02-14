-- Create enum for goal types
CREATE TYPE public.goal_type AS ENUM ('lose', 'maintain', 'gain');

-- Create enum for activity levels
CREATE TYPE public.activity_level AS ENUM ('sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extra_active');

-- Create enum for gender
CREATE TYPE public.gender AS ENUM ('male', 'female', 'other');

-- Create enum for meal types
CREATE TYPE public.meal_type AS ENUM ('breakfast', 'lunch', 'dinner', 'snack');

-- Create enum for food categories
CREATE TYPE public.food_category AS ENUM ('fruits', 'vegetables', 'proteins', 'grains', 'dairy', 'fats', 'beverages', 'snacks', 'custom');

-- Profiles table for user info and calculated targets
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT,
    age INTEGER,
    gender public.gender,
    current_weight DECIMAL(5,2),
    height DECIMAL(5,2),
    target_weight DECIMAL(5,2),
    goal_type public.goal_type DEFAULT 'maintain',
    activity_level public.activity_level DEFAULT 'moderately_active',
    daily_calorie_target INTEGER,
    daily_protein_target INTEGER,
    daily_carbs_target INTEGER,
    daily_fat_target INTEGER,
    unit_system TEXT DEFAULT 'metric',
    onboarding_completed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id)
);

-- Foods table (pre-populated + user custom)
CREATE TABLE public.foods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category public.food_category NOT NULL DEFAULT 'custom',
    calories_per_serving INTEGER NOT NULL,
    protein_grams DECIMAL(6,2) NOT NULL DEFAULT 0,
    carbs_grams DECIMAL(6,2) NOT NULL DEFAULT 0,
    fat_grams DECIMAL(6,2) NOT NULL DEFAULT 0,
    serving_size TEXT NOT NULL DEFAULT '100g',
    serving_grams DECIMAL(6,2) NOT NULL DEFAULT 100,
    is_system_food BOOLEAN DEFAULT false,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Meal logs table
CREATE TABLE public.meal_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    food_id UUID NOT NULL REFERENCES public.foods(id) ON DELETE CASCADE,
    meal_type public.meal_type NOT NULL,
    servings DECIMAL(4,2) NOT NULL DEFAULT 1,
    calories INTEGER NOT NULL,
    protein DECIMAL(6,2) NOT NULL DEFAULT 0,
    carbs DECIMAL(6,2) NOT NULL DEFAULT 0,
    fat DECIMAL(6,2) NOT NULL DEFAULT 0,
    logged_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Weight logs table
CREATE TABLE public.weight_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    weight DECIMAL(5,2) NOT NULL,
    logged_date DATE NOT NULL DEFAULT CURRENT_DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id, logged_date)
);

-- User favorites table
CREATE TABLE public.user_favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    food_id UUID NOT NULL REFERENCES public.foods(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id, food_id)
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.foods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weight_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;

-- Profiles policies (users can only access their own profile)
CREATE POLICY "Users can view their own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = user_id);

-- Foods policies (everyone can view system foods, users can manage their own custom foods)
CREATE POLICY "Anyone can view system foods"
    ON public.foods FOR SELECT
    USING (is_system_food = true);

CREATE POLICY "Users can view their own custom foods"
    ON public.foods FOR SELECT
    USING (created_by = auth.uid());

CREATE POLICY "Users can insert custom foods"
    ON public.foods FOR INSERT
    WITH CHECK (auth.uid() = created_by AND is_system_food = false);

CREATE POLICY "Users can update their own custom foods"
    ON public.foods FOR UPDATE
    USING (created_by = auth.uid() AND is_system_food = false);

CREATE POLICY "Users can delete their own custom foods"
    ON public.foods FOR DELETE
    USING (created_by = auth.uid() AND is_system_food = false);

-- Meal logs policies
CREATE POLICY "Users can view their own meal logs"
    ON public.meal_logs FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own meal logs"
    ON public.meal_logs FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own meal logs"
    ON public.meal_logs FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own meal logs"
    ON public.meal_logs FOR DELETE
    USING (auth.uid() = user_id);

-- Weight logs policies
CREATE POLICY "Users can view their own weight logs"
    ON public.weight_logs FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own weight logs"
    ON public.weight_logs FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own weight logs"
    ON public.weight_logs FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own weight logs"
    ON public.weight_logs FOR DELETE
    USING (auth.uid() = user_id);

-- User favorites policies
CREATE POLICY "Users can view their own favorites"
    ON public.user_favorites FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own favorites"
    ON public.user_favorites FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorites"
    ON public.user_favorites FOR DELETE
    USING (auth.uid() = user_id);

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Trigger for profiles timestamp updates
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Function to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (user_id)
    VALUES (NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Create indexes for performance
CREATE INDEX idx_meal_logs_user_date ON public.meal_logs(user_id, logged_date);
CREATE INDEX idx_weight_logs_user_date ON public.weight_logs(user_id, logged_date);
CREATE INDEX idx_foods_category ON public.foods(category);
CREATE INDEX idx_foods_system ON public.foods(is_system_food);
CREATE INDEX idx_user_favorites_user ON public.user_favorites(user_id);