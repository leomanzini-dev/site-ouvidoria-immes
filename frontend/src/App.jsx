import { useState } from 'react'

const rota = './api/manifestacoes.php'
const categorias = {
  elogio: 'Elogio',
  sugestao: 'Sugestão',
  reclamacao: 'Reclamação',
  solicitacao: 'Solicitação',
}
const situacoes = {
  recebida: 'Recebida',
  em_analise: 'Em análise',
  respondida: 'Respondida',
}

async function chamarApi(url, opcoes) {
  const resposta = await fetch(url, opcoes)
  if (!resposta.headers.get('content-type')?.includes('application/json')) {
    throw new Error('A resposta do servidor não veio em JSON. Confira o endereço da API.')
  }
  const dados = await resposta.json()
  if (!resposta.ok) throw new Error(dados.erro ?? 'Falha na requisição.')
  return dados
}

export default function App() {
  const [categoria, setCategoria] = useState('')
  const [mensagem, setMensagem] = useState('')
  const [protocolo, setProtocolo] = useState('')
  const [retornoCadastro, setRetornoCadastro] = useState('')
  const [erroConsulta, setErroConsulta] = useState('')
  const [resultado, setResultado] = useState(null)
  const [enviando, setEnviando] = useState(false)
  const [consultando, setConsultando] = useState(false)

  async function cadastrar(evento) {
    evento.preventDefault()
    setRetornoCadastro('')
    setEnviando(true)

    try {
      const dados = await chamarApi(rota, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoria, mensagem }),
      })
      setRetornoCadastro('Manifestação registrada. Guarde o protocolo ' + dados.protocolo)
      setProtocolo(dados.protocolo)
      setResultado(null)
      setErroConsulta('')
      setCategoria('')
      setMensagem('')
    } catch (erro) {
      setRetornoCadastro(erro.message)
    } finally {
      setEnviando(false)
    }
  }

  async function consultar(evento) {
    evento.preventDefault()
    setResultado(null)
    setErroConsulta('')
    setConsultando(true)

    try {
      const busca = new URLSearchParams({ protocolo: protocolo.trim() })
      const dados = await chamarApi(rota + '?' + busca)
      setResultado(dados)
    } catch (erro) {
      setErroConsulta(erro.message)
    } finally {
      setConsultando(false)
    }
  }

  return (
    <main>
      <header>
        <p>Faculdade Horizonte Acadêmico</p>
        <h1>Ouvidoria acadêmica</h1>
      </header>

      <section>
        <h2>Registrar manifestação</h2>
        <p>Para esta atividade, escreva uma mensagem fictícia sem dados pessoais.</p>
        <form onSubmit={cadastrar}>
          <label htmlFor="categoria">Categoria</label>
          <select id="categoria" required value={categoria}
            onChange={(evento) => setCategoria(evento.target.value)}>
            <option value="">Selecione</option>
            {Object.entries(categorias).map(([valor, nome]) => (
              <option value={valor} key={valor}>{nome}</option>
            ))}
          </select>

          <label htmlFor="mensagem">Mensagem (10 a 1000 caracteres)</label>
          <textarea id="mensagem" required minLength={10} maxLength={1000}
            rows={5} value={mensagem}
            onChange={(evento) => setMensagem(evento.target.value)} />

          <button disabled={enviando}>{enviando ? 'Enviando...' : 'Registrar'}</button>
        </form>
        <p className="retorno" role="status">{retornoCadastro}</p>
      </section>

      <section>
        <h2>Consultar protocolo</h2>
        <form onSubmit={consultar}>
          <label htmlFor="protocolo">Protocolo de 32 caracteres</label>
          <input id="protocolo" required value={protocolo}
            onChange={(evento) => setProtocolo(evento.target.value)} />
          <button disabled={consultando}>{consultando ? 'Consultando...' : 'Consultar'}</button>
        </form>
        <div className="retorno" role="status">
          {erroConsulta && <p>{erroConsulta}</p>}
          {resultado && (
            <dl>
              <dt>Protocolo</dt><dd>{resultado.protocolo}</dd>
              <dt>Categoria</dt><dd>{categorias[resultado.categoria]}</dd>
              <dt>Situação</dt><dd>{situacoes[resultado.situacao]}</dd>
              <dt>Registrada em</dt><dd>{resultado.criada_em}</dd>
            </dl>
          )}
        </div>
      </section>
    </main>
  )
}
