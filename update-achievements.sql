-- Update achievements with missing basic activity achievements
-- This script adds the missing achievements that are referenced in the code

INSERT INTO achievements (id, name, description, aura_reward, icon_name, category, requirements) VALUES
-- Basic Activity Achievements
('first_workout', 'First Workout', 'Complete your first workout', 15, 'fire', 'workout', '{"type": "first_workout"}'),
('first_meal', 'First Meal', 'Complete your first meal', 10, 'restaurant', 'meal', '{"type": "first_meal"}'),

-- Aura Level Achievements
('aura_collector', 'Aura Collector', 'Earn 100 Aura points', 25, 'star', 'aura', '{"type": "aura_total", "amount": 100}'),
('aura_master', 'Aura Master', 'Earn 500 Aura points', 50, 'crown', 'aura', '{"type": "aura_total", "amount": 500}'),
('aura_legend', 'Aura Legend', 'Earn 1000 Aura points', 100, 'trophy', 'aura', '{"type": "aura_total", "amount": 1000}')

ON CONFLICT (id) DO NOTHING;
