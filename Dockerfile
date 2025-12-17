FROM nginx:alpine

# Hapus config default
RUN rm /etc/nginx/conf.d/default.conf

# Copy config nginx custom
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy semua file html/css/js
COPY . /usr/share/nginx/html

EXPOSE 80
