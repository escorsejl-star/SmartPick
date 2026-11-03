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

INSERT INTO caixas (codigo, descricao, categoria, quantidade, minimo, ean, peso_kg, altura_cm, largura_cm, profundidade_cm, posicao_id) VALUES
  ('TN-5501', 'Tênis Nike Air Max 270', 'Calçados', 48, 10, '7891000055012', 1.8, 15, 22, 35, (SELECT id FROM posicoes WHERE codigo = 'P1-N1-F1')),
  ('TV-8801', 'Smart TV Samsung 55" QLED', 'Eletrônicos', 6, 3, '7891000088014', 17.5, 71, 15, 123, (SELECT id FROM posicoes WHERE codigo = 'P4-N1-F1')),
  ('NB-3201', 'Notebook Dell Inspiron 15', 'Eletrônicos', 12, 5, '7891000032013', 1.9, 4, 26, 38, (SELECT id FROM posicoes WHERE codigo = 'P1-N3-F1')),
  ('CA-7710', 'Câmera Canon EOS R50', 'Eletrônicos', 3, 5, '7891000077106', 0.7, 8, 9, 12, (SELECT id FROM posicoes WHERE codigo = 'P2-N2-F1')),
  ('CH-1142', 'Chuveiro Lorenzetti Advanced', 'Elétricos', 22, 8, '7891000011425', 0.9, 12, 20, 20, (SELECT id FROM posicoes WHERE codigo = 'P2-N1-F2')),
  ('SD-5501', 'Sofá 3 Lugares Revestido', 'Móveis', 4, 2, '7891000055019', 42, 85, 90, 210, (SELECT id FROM posicoes WHERE codigo = 'P5-N1-F1')),
  ('BL-0011', 'Blusa Polo Lacoste P', 'Vestuário', 65, 20, '7891000000115', 0.3, 3, 25, 30, (SELECT id FROM posicoes WHERE codigo = 'P3-N3-F2'));

UPDATE posicoes SET ocupada = TRUE
WHERE id IN (SELECT posicao_id FROM caixas WHERE posicao_id IS NOT NULL);

INSERT INTO caixas (codigo, descricao, categoria, quantidade, minimo, ean, peso_kg, altura_cm, largura_cm, profundidade_cm) VALUES
  ('AQ-2250', 'Ar Cond. Midea 12000 BTU', 'Eletrônicos', 8, 4, '7891000022504', 11, 28, 80, 30);

INSERT INTO usuarios (login, senha_hash, nome, perfil) VALUES
  ('GT-1001', SHA2('1234', 256), 'Gustavo Lima', 'gestor'),
  ('OP-2847', SHA2('1234', 256), 'Carlos Mendes', 'operador');

INSERT INTO pedidos (cliente, itens, peso_kg, prioridade, coletor, status, eta, progresso) VALUES
  ('Magazine Luiza', 8, 12.4, 'P1', 'Carlos M.', 'Em Andamento', '16:10', 50),
  ('Americanas S.A.', 14, 8.2, 'P1', 'Ana P.', 'Iniciado', '16:45', 14),
  ('Shopee Brasil', 3, 3.1, 'P2', 'Marcos S.', 'Concluído', '15:30', 100),
  ('Mercado Livre', 21, 24.8, 'P1', 'Juliana F.', 'Em Andamento', '17:00', 33),
  ('TOTVS Dist.', 6, 5.6, 'P2', 'Carlos M.', 'Concluído', '15:12', 100),
  ('Lojas Renner', 18, 9.4, 'P2', 'Pedro A.', 'Iniciado', '17:30', 6),
  ('Tok&Stok', 4, 38.2, 'P1', 'Juliana F.', 'Em Andamento', '16:20', 75),
  ('iFood Mercado', 11, 7.8, 'P3', NULL, 'Pendente', '18:00', 0),
  ('B2W Digital', 9, 6.1, 'P2', NULL, 'Pendente', '18:15', 0),
  ('Via Varejo', 7, 4.9, 'P3', NULL, 'Pendente', '18:30', 0);

UPDATE pedidos SET atualizado_em = NOW() - INTERVAL ((id * 7) % 10) * 7 MINUTE;
