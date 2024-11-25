#!/bin/bash

# Token và Chat ID
BOT_TOKEN="7940588459:AAHMJG21fOgfd9h8QcpZnNg2_thd33MFFc8" 
CHAT_ID="-4531872882"     
MESSAGE="$1"    

# Đảm bảo rằng nội dung thông báo được mã hóa đúng UTF-8
ENCODED_MESSAGE=$(echo "$MESSAGE" | iconv -f utf-8 -t utf-8//IGNORE)

# Gửi thông báo qua Telegram với mã hóa UTF-8
curl -s -X POST "https://api.telegram.org/bot${BOT_TOKEN}/sendMessage" \
  --data-urlencode "chat_id=${CHAT_ID}" \
  --data-urlencode "parse_mode=Markdown" \
  --data-urlencode "text=${ENCODED_MESSAGE}"
