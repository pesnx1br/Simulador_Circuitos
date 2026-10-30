# Bancada Elétrica 3D

Simulador de circuitos elétricos no navegador, com editor 2D, visualização 3D animada e um modo de cálculo automático com passo a passo.

## Como usar
Abra `index.html` num navegador (precisa de internet para carregar o three.js) ou rode `npm start` e acesse http://localhost:8000.

- **Montar Circuito**: arraste componentes da biblioteca, clique em um terminal e depois em outro para ligar.
- **Calcular Circuito**: escolha os componentes, informe valores e a ligação (série, paralelo ou personalizada) e clique em *Calcular e Simular*.
- Atalhos: `R` gira, `Del` remove, clique direito num terminal remove fios, duplo clique alterna chave.
- No 3D: arraste para girar, roda para zoom, passe o mouse sobre uma peça para ver valores, clique para selecionar.

## Estrutura
| Arquivo | Conteúdo |
|---|---|
| `index.html` | Estrutura da página |
| `css/style.css` | Tema escuro e layout |
| `js/core.js` | Componentes, unidades e estado |
| `js/engine.js` | Motor de cálculo (MNA, Euler implícito, Newton) |
| `js/editor2d.js` | Editor 2D, painéis e controles |
| `js/view3d.js` | Cena 3D e modelos dos componentes |
| `js/anim.js` | Animação da corrente e dicas |
| `js/calc-mode.js` | Modo Calcular Circuito |
| `js/main.js` | Laço principal e inicialização |
| `tests/engine.test.js` | Testes do motor contra fórmulas teóricas |

Os scripts são carregados em ordem por `index.html` e compartilham o escopo global.

## Testes
```
npm test
```
Verifica série, paralelo, carga do RC, crescimento do RL, LED e corrente de pico em AC.

## Limitações atuais
Sem transistores, motores, trifásica, transformador e fontes controladas.

## Licença
MIT
