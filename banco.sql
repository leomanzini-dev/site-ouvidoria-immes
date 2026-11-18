CREATE TABLE IF NOT EXISTS manifestacoes (
    protocolo CHAR(32) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
    categoria ENUM('elogio', 'sugestao', 'reclamacao', 'solicitacao') NOT NULL,
    mensagem VARCHAR(1000) NOT NULL,
    situacao ENUM('recebida', 'em_analise', 'respondida')
        NOT NULL DEFAULT 'recebida',
    criada_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
