<h1 align="center">Print Stocks Serverless</h1>
<p align="center">Receba os gráficos dos seus ativos preferidos disponiveis no <a href="https://tradingview.com">TradingView</a> por e-mail</p>

<p align="center">
  <img src="https://img.shields.io/badge/Amazon_AWS-FF9900?style=for-the-badge&logo=amazonaws&logoColor=white"/>
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white"/>
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white"/>
  <img src="https://img.shields.io/badge/Puppeteer-40B5A4?style=for-the-badge&logo=Puppeteer&logoColor=white"/>
</p>

## 📑 Índice
<!--ts-->
   * [🔧 Instalação](#-instalação)
   * [📚 Exemplos](#-exemplos)
   * [💻 Tecnologias](#-tecnologias)
<!--te-->

## 🔧 Instalação

1. Você precisará do [Node.js](https://nodejs.org/) instalado e uma conta na [AWS](https://aws.amazon.com/pt/). O nível gratuito é suficiente.

1. Instale e configure o [AWS CLI](https://aws.amazon.com/pt/cli/).

1. Instale o [Serverless](https://www.serverless.com/) globalmente:
```bash
  npm i -g serverless
```

3. Clone o projeto:
```bash
  git clone https://github.com/alvaromrveiga/print-stocks-serverless
```

4. Entre na pasta e instale as dependências:
```bash
  cd print-stocks-serverless

  npm i
```

5. Faça o deploy para a AWS:
```bash
  sls deploy
```

6. Se quiser invocar a função antes do horário programado:
```bash
  # Por padrão a função é executada 18h30 no horário de Brasília
  sls invoke -f printStocks -l
```

## 📚 Exemplos

<p align="center">
  <h4>Exemplo de e-mail recebido:</h4>
  <img src="https://github.com/alvaromrveiga/print-stocks-serverless/blob/main/assets/emailStocks.png"/>
  
  <h4>Execução em modo headfull para mostrar os passos:</h4>https://github.com/alvaromrveiga/print-stocks-serverless/blob/main/assets/headfull.gif
  <img src="https://github.com/alvaromrveiga/print-stocks-serverless/blob/main/assets/headfull.gif"/>
</p>


## 💻 Tecnologias
- [Node.js](https://nodejs.org/en/) e [Typescript](https://www.typescriptlang.org/)
- [Puppeteer](https://github.com/puppeteer/puppeteer) - Automatizar ações no Chromium
- [chrome-aws-lambda](https://github.com/alixaxel/chrome-aws-lambda) - Binário do Chromium compactado para AWS Lambdas
- [chrome-aws-lambda-layer](https://github.com/shelfio/chrome-aws-lambda-layer) - Lambda layer com o chrome-aws-lambda
- [aws-sdk](https://github.com/aws/aws-sdk-js) - Funções dos serviços SES e S3
