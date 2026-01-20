# 開発用Dockerfile
FROM node:20-alpine

WORKDIR /app

# 依存関係のインストールに必要なパッケージ
RUN apk add --no-cache git

# package.jsonとpackage-lock.jsonをコピー
COPY package*.json ./

# 依存関係のインストール
RUN npm install

# ソースコードをコピー
COPY . .

# Nuxt開発サーバーのポート
EXPOSE 3000

# 開発サーバー起動
CMD ["npm", "run", "dev"]
