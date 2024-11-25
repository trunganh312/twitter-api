#!/bin/bash

# Token và Chat ID
BOT_TOKEN="7940588459:AAHMJG21fOgfd9h8QcpZnNg2_thd33MFFc8"
CHAT_ID="-4531872882"
MESSAGE="$1"  # Lấy thông báo từ tham số đầu vào

# Đảm bảo rằng tin nhắn được mã hóa đúng UTF-8
ENCODED_MESSAGE=$(echo "$MESSAGE" | jq -sRr @uri)

# Gửi thông báo qua Telegram API với phương thức POST
curl -s -X POST "https://api.telegram.org/bot${BOT_TOKEN}/sendMessage" \
  -d chat_id="${CHAT_ID}" \
  -d parse_mode="Markdown" \
  -d text="${ENCODED_MESSAGE}"
  

echo "Message sent successfully!"
