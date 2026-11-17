SET NAMES utf8mb4;

DROP DATABASE IF EXISTS smartpick;
CREATE DATABASE smartpick CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE smartpick;

CREATE TABLE prateleiras (
  id INT AUTO_INCREMENT PRIMARY KEY,
  codigo VARCHAR(10) NOT NULL UNIQUE,
  corredor VARCHAR(10) NOT NULL
);

CREATE TABLE posicoes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  prateleira_id INT NOT NULL,
  codigo VARCHAR(20) NOT NULL UNIQUE,
  nivel INT NOT NULL,
  profundidade INT NOT NULL,
  restrita BOOLEAN NOT NULL DEFAULT FALSE,
  ocupada BOOLEAN NOT NULL DEFAULT FALSE,
  FOREIGN KEY (prateleira_id) REFERENCES prateleiras(id),
  CHECK (nivel BETWEEN 1 AND 3),
  CHECK (profundidade BETWEEN 1 AND 2)
);

CREATE TABLE caixas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  codigo VARCHAR(20) NULL UNIQUE,
  descricao VARCHAR(100) NOT NULL,
  categoria VARCHAR(50) NULL,
  quantidade INT NOT NULL DEFAULT 1,
  minimo INT NOT NULL DEFAULT 0,
  ean VARCHAR(13) NULL,
  peso_kg DECIMAL(6,2) NOT NULL,
  altura_cm DECIMAL(6,2) NOT NULL,
  largura_cm DECIMAL(6,2) NOT NULL,
  profundidade_cm DECIMAL(6,2) NOT NULL,
  posicao_id INT NULL UNIQUE,
  cadastrada_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (posicao_id) REFERENCES posicoes(id),
  CHECK (peso_kg > 0),
  CHECK (altura_cm > 0 AND largura_cm > 0 AND profundidade_cm > 0)
);

CREATE TABLE usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  login VARCHAR(20) NOT NULL UNIQUE,
  senha_hash CHAR(64) NOT NULL,
  nome VARCHAR(100) NOT NULL,
  perfil VARCHAR(10) NOT NULL,
  CHECK (perfil IN ('operador', 'gestor'))
);

CREATE TABLE pedidos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cliente VARCHAR(100) NOT NULL,
  itens INT NOT NULL DEFAULT 1,
  peso_kg DECIMAL(6,2) NOT NULL DEFAULT 1,
  prioridade VARCHAR(2) NOT NULL DEFAULT 'P3',
  coletor VARCHAR(50) NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'Pendente',
  eta TIME NULL,
  progresso INT NOT NULL DEFAULT 0,
  atualizado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CHECK (prioridade IN ('P1', 'P2', 'P3')),
  CHECK (status IN ('Pendente', 'Iniciado', 'Em Andamento', 'Concluído')),
  CHECK (progresso BETWEEN 0 AND 100)
) AUTO_INCREMENT = 2251;

-- Produtos de cada pedido
CREATE TABLE pedido_itens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  pedido_id INT NOT NULL,
  caixa_id INT NOT NULL,
  quantidade INT NOT NULL DEFAULT 1,
  coletado BOOLEAN NOT NULL DEFAULT FALSE,
  FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE,
  FOREIGN KEY (caixa_id) REFERENCES caixas(id) ON DELETE CASCADE,
  CHECK (quantidade > 0)
);

INSERT INTO prateleiras (codigo, corredor) VALUES
  ('P1', 'T1'),
  ('P2', 'T2'),
  ('P3', 'R1'),
  ('P4', 'B1'),
  ('P5', 'B2'),
  ('P6', 'R3');

INSERT INTO posicoes (prateleira_id, codigo, nivel, profundidade)
SELECT p.id, CONCAT(p.codigo, '-N', n.nivel, '-F', f.profundidade), n.nivel, f.profundidade
FROM prateleiras p
CROSS JOIN (SELECT 1 AS nivel UNION SELECT 2 UNION SELECT 3) n
CROSS JOIN (SELECT 1 AS profundidade UNION SELECT 2) f
ORDER BY p.id, n.nivel, f.profundidade;

UPDATE posicoes SET restrita = TRUE WHERE codigo = 'P6-N1-F1';

-- Nicho: loja de eletrônicos e eletrodomésticos.
-- Cada prateleira guarda uma categoria:
--   P1 Áudio | P2 Celulares | P3 Informática | P4 Cozinha | P5 Linha Branca | P6 TV e Clima
-- Padrão dos níveis:
--   Nível 1 (chão): produtos pesados (20 kg ou mais) e volumosos
--   Nível 2: produtos médios e leves, acesso manual
--   Nível 3: produtos leves, só com empilhadeira
-- Produto com 20 kg ou mais sempre pede empilhadeira, mesmo no chão.
-- A última caixa fica sem posição, para testar a tela de armazenar.
INSERT INTO caixas (codigo, descricao, categoria, quantidade, minimo, ean, peso_kg, altura_cm, largura_cm, profundidade_cm, posicao_id) VALUES
  ('AU-1010', 'Fone Bluetooth JBL Tune 520', 'Áudio', 80, 20, '7891000010100', 0.3, 20, 18, 8, (SELECT id FROM posicoes WHERE codigo = 'P1-N2-F1')),
  ('AU-1020', 'Caixa de Som JBL Flip 6', 'Áudio', 45, 15, '7891000010201', 0.8, 10, 22, 10, (SELECT id FROM posicoes WHERE codigo = 'P1-N2-F2')),
  ('AU-1030', 'Soundbar Samsung HW-B550', 'Áudio', 14, 5, '7891000010302', 4.5, 15, 95, 20, (SELECT id FROM posicoes WHERE codigo = 'P1-N1-F1')),
  ('AU-1040', 'Headphone Sony WH-CH720N', 'Áudio', 30, 10, '7891000010403', 0.4, 22, 19, 9, (SELECT id FROM posicoes WHERE codigo = 'P1-N3-F1')),
  ('CE-2010', 'Smartphone Samsung Galaxy A55', 'Celulares', 60, 20, '7891000020104', 0.5, 18, 10, 6, (SELECT id FROM posicoes WHERE codigo = 'P2-N2-F1')),
  ('CE-2020', 'Smartphone Motorola Moto G84', 'Celulares', 52, 20, '7891000020205', 0.5, 18, 10, 6, (SELECT id FROM posicoes WHERE codigo = 'P2-N2-F2')),
  ('CE-2030', 'Tablet Samsung Galaxy Tab A9', 'Celulares', 25, 8, '7891000020306', 0.9, 28, 19, 6, (SELECT id FROM posicoes WHERE codigo = 'P2-N3-F1')),
  ('CE-2040', 'Smartwatch Xiaomi Redmi Watch 4', 'Celulares', 6, 10, '7891000020407', 0.2, 10, 10, 8, (SELECT id FROM posicoes WHERE codigo = 'P2-N3-F2')),
  ('IN-3010', 'Notebook Dell Inspiron 15', 'Informática', 18, 6, '7891000030108', 2.4, 8, 45, 32, (SELECT id FROM posicoes WHERE codigo = 'P3-N2-F1')),
  ('IN-3020', 'Monitor LG 24" Full HD', 'Informática', 16, 5, '7891000030209', 4.2, 42, 62, 14, (SELECT id FROM posicoes WHERE codigo = 'P3-N1-F1')),
  ('IN-3030', 'Impressora HP Smart Tank 581', 'Informática', 9, 4, '7891000030300', 6.1, 25, 48, 40, (SELECT id FROM posicoes WHERE codigo = 'P3-N1-F2')),
  ('IN-3040', 'Kit Teclado e Mouse Logitech MK235', 'Informática', 40, 12, '7891000030401', 0.7, 6, 46, 17, (SELECT id FROM posicoes WHERE codigo = 'P3-N3-F1')),
  ('CZ-4010', 'Fogão Consul 4 Bocas', 'Cozinha', 7, 3, '7891000040102', 26.5, 90, 52, 62, (SELECT id FROM posicoes WHERE codigo = 'P4-N1-F1')),
  ('CZ-4020', 'Micro-ondas Electrolux 20L', 'Cozinha', 12, 5, '7891000040203', 11.5, 30, 50, 38, (SELECT id FROM posicoes WHERE codigo = 'P4-N1-F2')),
  ('CZ-4030', 'Air Fryer Mondial 4L', 'Cozinha', 28, 10, '7891000040304', 4.3, 34, 30, 30, (SELECT id FROM posicoes WHERE codigo = 'P4-N2-F1')),
  ('CZ-4040', 'Liquidificador Philips Walita', 'Cozinha', 35, 10, '7891000040405', 2.1, 40, 22, 22, (SELECT id FROM posicoes WHERE codigo = 'P4-N2-F2')),
  ('CZ-4050', 'Cafeteira Nespresso Vertuo', 'Cozinha', 4, 6, '7891000040506', 3.8, 35, 25, 40, (SELECT id FROM posicoes WHERE codigo = 'P4-N3-F1')),
  ('LB-5010', 'Geladeira Brastemp Frost Free 375L', 'Linha Branca', 5, 2, '7891000050107', 68, 185, 65, 72, (SELECT id FROM posicoes WHERE codigo = 'P5-N1-F1')),
  ('LB-5020', 'Lavadora Electrolux 12kg', 'Linha Branca', 6, 3, '7891000050208', 38, 105, 62, 68, (SELECT id FROM posicoes WHERE codigo = 'P5-N1-F2')),
  ('LB-5030', 'Purificador de Água Electrolux', 'Linha Branca', 15, 5, '7891000050309', 3.2, 42, 28, 38, (SELECT id FROM posicoes WHERE codigo = 'P5-N2-F1')),
  ('TV-6010', 'Smart TV Samsung 55" QLED', 'TV e Clima', 8, 3, '7891000060100', 17.5, 85, 135, 18, (SELECT id FROM posicoes WHERE codigo = 'P6-N1-F1')),
  ('TV-6020', 'Smart TV LG 75" 4K', 'TV e Clima', 3, 2, '7891000060201', 32, 110, 180, 20, (SELECT id FROM posicoes WHERE codigo = 'P6-N1-F2')),
  ('TV-6030', 'Ar Condicionado Midea 12000 BTU', 'TV e Clima', 10, 4, '7891000060302', 11, 30, 82, 28, (SELECT id FROM posicoes WHERE codigo = 'P6-N2-F1')),
  ('CZ-4060', 'Aspirador de Pó Electrolux 1400W', 'Cozinha', 12, 4, '7891000040603', 5.6, 35, 32, 45, NULL);

UPDATE posicoes SET ocupada = TRUE
WHERE id IN (SELECT posicao_id FROM caixas WHERE posicao_id IS NOT NULL);

INSERT INTO usuarios (login, senha_hash, nome, perfil) VALUES
  ('GT-1001', SHA2('1234', 256), 'Gustavo Lima', 'gestor'),
  ('OP-2847', SHA2('1234', 256), 'Carlos Mendes', 'operador');

INSERT INTO pedidos (cliente, itens, peso_kg, prioridade, coletor, status, eta, progresso) VALUES
  ('Magazine Luiza', 8, 12.4, 'P1', 'Carlos M.', 'Em Andamento', '16:10', 50),
  ('Americanas S.A.', 14, 8.2, 'P1', 'Ana P.', 'Iniciado', '16:45', 0),
  ('Shopee Brasil', 3, 3.1, 'P2', 'Marcos S.', 'Concluído', '15:30', 100),
  ('Mercado Livre', 21, 24.8, 'P1', 'Juliana F.', 'Em Andamento', '17:00', 33),
  ('Casas Bahia', 6, 5.6, 'P2', 'Carlos M.', 'Concluído', '15:12', 100),
  ('Fast Shop', 18, 9.4, 'P2', 'Pedro A.', 'Iniciado', '17:30', 0),
  ('KaBuM!', 4, 38.2, 'P1', 'Rafael T.', 'Em Andamento', '16:20', 75),
  ('Ponto', 11, 7.8, 'P3', NULL, 'Pendente', '18:00', 0),
  ('Amazon Brasil', 9, 6.1, 'P2', NULL, 'Pendente', '18:15', 0),
  ('Carrefour', 7, 4.9, 'P3', NULL, 'Pendente', '18:30', 0);

INSERT INTO pedido_itens (pedido_id, caixa_id, quantidade) VALUES
  (2251, (SELECT id FROM caixas WHERE codigo = 'AU-1010'), 3),
  (2251, (SELECT id FROM caixas WHERE codigo = 'CE-2010'), 2),
  (2251, (SELECT id FROM caixas WHERE codigo = 'CZ-4030'), 1),
  (2251, (SELECT id FROM caixas WHERE codigo = 'TV-6010'), 1),
  (2251, (SELECT id FROM caixas WHERE codigo = 'IN-3010'), 1),
  (2252, (SELECT id FROM caixas WHERE codigo = 'CE-2020'), 4),
  (2252, (SELECT id FROM caixas WHERE codigo = 'AU-1020'), 3),
  (2252, (SELECT id FROM caixas WHERE codigo = 'IN-3040'), 4),
  (2252, (SELECT id FROM caixas WHERE codigo = 'CZ-4040'), 2),
  (2252, (SELECT id FROM caixas WHERE codigo = 'LB-5030'), 1),
  (2253, (SELECT id FROM caixas WHERE codigo = 'AU-1040'), 2),
  (2253, (SELECT id FROM caixas WHERE codigo = 'CE-2030'), 1),
  (2254, (SELECT id FROM caixas WHERE codigo = 'LB-5010'), 1),
  (2254, (SELECT id FROM caixas WHERE codigo = 'LB-5020'), 1),
  (2254, (SELECT id FROM caixas WHERE codigo = 'CZ-4010'), 1),
  (2254, (SELECT id FROM caixas WHERE codigo = 'CZ-4020'), 2),
  (2254, (SELECT id FROM caixas WHERE codigo = 'TV-6030'), 1),
  (2255, (SELECT id FROM caixas WHERE codigo = 'IN-3020'), 2),
  (2255, (SELECT id FROM caixas WHERE codigo = 'IN-3030'), 1),
  (2255, (SELECT id FROM caixas WHERE codigo = 'IN-3040'), 3),
  (2256, (SELECT id FROM caixas WHERE codigo = 'CE-2010'), 5),
  (2256, (SELECT id FROM caixas WHERE codigo = 'CE-2040'), 2),
  (2256, (SELECT id FROM caixas WHERE codigo = 'AU-1010'), 6),
  (2256, (SELECT id FROM caixas WHERE codigo = 'AU-1030'), 1),
  (2257, (SELECT id FROM caixas WHERE codigo = 'TV-6020'), 1),
  (2257, (SELECT id FROM caixas WHERE codigo = 'TV-6010'), 1),
  (2257, (SELECT id FROM caixas WHERE codigo = 'AU-1030'), 2),
  (2258, (SELECT id FROM caixas WHERE codigo = 'CZ-4030'), 3),
  (2258, (SELECT id FROM caixas WHERE codigo = 'CZ-4040'), 4),
  (2258, (SELECT id FROM caixas WHERE codigo = 'CZ-4050'), 1),
  (2258, (SELECT id FROM caixas WHERE codigo = 'CZ-4020'), 1),
  (2259, (SELECT id FROM caixas WHERE codigo = 'IN-3010'), 2),
  (2259, (SELECT id FROM caixas WHERE codigo = 'IN-3020'), 2),
  (2259, (SELECT id FROM caixas WHERE codigo = 'CE-2030'), 3),
  (2260, (SELECT id FROM caixas WHERE codigo = 'LB-5010'), 1),
  (2260, (SELECT id FROM caixas WHERE codigo = 'TV-6030'), 2),
  (2260, (SELECT id FROM caixas WHERE codigo = 'LB-5030'), 2);

-- O que já foi coletado: tudo nos pedidos concluídos e uma parte nos que estão em andamento
UPDATE pedido_itens SET coletado = TRUE WHERE pedido_id IN (2253, 2255);
UPDATE pedido_itens SET coletado = TRUE
WHERE pedido_id = 2251 AND caixa_id IN (SELECT id FROM caixas WHERE codigo IN ('AU-1010', 'CZ-4030'));
UPDATE pedido_itens SET coletado = TRUE
WHERE pedido_id = 2254 AND caixa_id IN (SELECT id FROM caixas WHERE codigo = 'CZ-4020');
UPDATE pedido_itens SET coletado = TRUE
WHERE pedido_id = 2257 AND caixa_id IN (SELECT id FROM caixas WHERE codigo IN ('TV-6020', 'TV-6010'));

-- O total de itens, o peso e o progresso de cada pedido vêm dos produtos dele
UPDATE pedidos p SET
  itens = (SELECT SUM(pi.quantidade) FROM pedido_itens pi WHERE pi.pedido_id = p.id),
  peso_kg = (SELECT SUM(pi.quantidade * c.peso_kg) FROM pedido_itens pi JOIN caixas c ON c.id = pi.caixa_id WHERE pi.pedido_id = p.id),
  progresso = (SELECT ROUND(100 * SUM(pi.coletado * pi.quantidade) / SUM(pi.quantidade)) FROM pedido_itens pi WHERE pi.pedido_id = p.id);

UPDATE pedidos SET atualizado_em = NOW() - INTERVAL ((id * 7) % 10) * 7 MINUTE;
