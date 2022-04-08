#! /bin/sh
echo "Setting up MongoDB"
sed -i \
      -e "s@##MONGO_DB_HOST##@""$MONGO_DB_HOST""@g" \
      -e "s@##MONGO_DB_PORT##@""${MONGO_DB_PORT:=27017}""@g" \
      -e "s@##MONGO_DB_NAME##@""${MONGO_DB_NAME:=usersdb}""@g" \
/opt/mitrachatbot/data/mongo_consts.js
sed -i \
      -e "s@##TELEGRAM_BOT_HOSTNAME##@""${TELEGRAM_BOT_HOSTNAME:=0.0.0.0}""@g" \
      -e "s@##TELEGRAM_BOT_PORT##@""${TELEGRAM_BOT_PORT:=25059}""@g" \
/opt/mitrachatbot/bots/telegram_consts.js
echo "Done. Starting up..."
exec npm run production