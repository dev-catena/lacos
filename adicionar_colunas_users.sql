-- Adicionar colunas de dados pessoais na tabela users
-- Verificar se as colunas não existem antes de adicionar

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS last_name VARCHAR(255) NULL AFTER name;

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS cpf VARCHAR(14) NULL AFTER birth_date;

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS address VARCHAR(255) NULL AFTER cpf;

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS address_number VARCHAR(20) NULL AFTER address;

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS address_complement VARCHAR(255) NULL AFTER address_number;

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS state VARCHAR(2) NULL AFTER city;

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS zip_code VARCHAR(10) NULL AFTER state;

