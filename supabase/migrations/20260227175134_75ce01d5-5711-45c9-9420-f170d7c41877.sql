
-- Add CoD parameters to teams table
ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS cod_persons integer NOT NULL DEFAULT 3;
ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS cod_overhead_factor numeric NOT NULL DEFAULT 1.5;

-- Seed org-level CoD defaults in economic_config
INSERT INTO public.economic_config (config_key, config_value, label, description, category)
VALUES 
  ('cod_hourly_rate', 85, 'Ø Stundensatz (€/h)', 'Durchschnittlicher Stundensatz für Cost-of-Delay Berechnungen', 'cost_of_delay'),
  ('cod_persons', 3, 'Beteiligte Personen', 'Anzahl blockierter Personen pro offener Entscheidung', 'cost_of_delay'),
  ('cod_overhead_factor', 1.5, 'Overhead-Faktor', 'Multiplikator für indirekte Kosten (Opportunität, Motivation)', 'cost_of_delay')
ON CONFLICT DO NOTHING;
