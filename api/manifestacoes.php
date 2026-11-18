<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

function responder(int $status, array $dados): never
{
    http_response_code($status);
    echo json_encode($dados, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
    exit;
}

function conectar(): mysqli
{
    $config = require __DIR__ . '/config.php';
    mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

    $banco = new mysqli(
        $config['host'], $config['usuario'], $config['senha'],
        $config['banco'], $config['porta']
    );
    $banco->set_charset('utf8mb4');
    return $banco;
}

try {
    $metodo = $_SERVER['REQUEST_METHOD'];

    if ($metodo === 'POST') {
        $tipo = strtolower(trim(explode(';', $_SERVER['CONTENT_TYPE'] ?? '')[0]));
        if ($tipo !== 'application/json') {
            responder(415, ['erro' => 'Envie um corpo em JSON.']);
        }

        $corpo = file_get_contents('php://input', false, null, 0, 16385);
        if ($corpo === false) {
            responder(400, ['erro' => 'Não foi possível ler o corpo.']);
        }
        if (strlen($corpo) > 16384) {
            responder(413, ['erro' => 'Corpo da requisição acima do limite.']);
        }

        $dados = json_decode($corpo, true, 32, JSON_THROW_ON_ERROR);
        if (!is_array($dados)) {
            responder(400, ['erro' => 'Envie categoria e mensagem.']);
        }

        $categoria = $dados['categoria'] ?? '';
        $mensagem = $dados['mensagem'] ?? '';
        $categorias = ['elogio', 'sugestao', 'reclamacao', 'solicitacao'];

        if (!in_array($categoria, $categorias, true)) {
            responder(400, ['erro' => 'Selecione uma categoria válida.']);
        }

        $mensagem = is_string($mensagem) ? trim($mensagem) : '';
        $tamanho = preg_match_all('/./us', $mensagem);
        if ($tamanho < 10 || $tamanho > 1000) {
            responder(400, ['erro' => 'A mensagem deve ter de 10 a 1000 caracteres.']);
        }

        $protocolo = bin2hex(random_bytes(16));
        $banco = conectar();
        $stmt = $banco->prepare(
            'INSERT INTO manifestacoes (protocolo, categoria, mensagem) VALUES (?, ?, ?)'
        );
        $stmt->bind_param('sss', $protocolo, $categoria, $mensagem);
        $stmt->execute();

        responder(201, ['protocolo' => $protocolo, 'situacao' => 'recebida']);
    }

    if ($metodo === 'GET') {
        $protocolo = $_GET['protocolo'] ?? '';
        if (!is_string($protocolo) || !preg_match('/\A[0-9a-f]{32}\z/i', $protocolo)) {
            responder(400, ['erro' => 'Informe um protocolo de 32 caracteres hexadecimais.']);
        }

        $protocolo = strtolower($protocolo);
        $banco = conectar();
        $stmt = $banco->prepare(
            'SELECT categoria, situacao, criada_em FROM manifestacoes WHERE protocolo = ?'
        );
        $stmt->bind_param('s', $protocolo);
        $stmt->execute();
        $stmt->bind_result($categoria, $situacao, $data);

        if ($stmt->fetch() !== true) {
            responder(404, ['erro' => 'Protocolo não encontrado.']);
        }

        responder(200, [
            'protocolo' => $protocolo,
            'categoria' => $categoria,
            'situacao' => $situacao,
            'criada_em' => $data,
        ]);
    }

    header('Allow: GET, POST');
    responder(405, ['erro' => 'Método não permitido.']);
} catch (JsonException $erro) {
    responder(400, ['erro' => 'JSON inválido.']);
} catch (Throwable $erro) {
    error_log('Falha na ouvidoria: ' . get_class($erro) . ' (' . $erro->getCode() . ')');
    responder(500, ['erro' => 'Falha interna. Confira o banco e a configuração do servidor.']);
}
