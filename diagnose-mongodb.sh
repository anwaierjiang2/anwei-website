#!/bin/bash

# 诊断MongoDB启动问题的脚本

# 1. 检查MongoDB服务状态详细信息
echo "=== MongoDB服务状态详细信息 ==="
systemctl status mongod -l

# 2. 查找MongoDB日志文件位置
echo "
=== 查找MongoDB日志文件位置 ==="
log_path=$(grep -r "logpath" /etc/mongod.conf 2>/dev/null | cut -d'=' -f2 | tr -d ' ') || echo "/var/log/mongodb/mongod.log (默认路径)"

# 3. 显示日志文件内容（如果存在）
echo "
=== MongoDB日志内容 ==="
if [ -f "$log_path" ]; then
    tail -n 50 "$log_path"
else
    echo "日志文件不存在: $log_path"
    echo "尝试查找其他可能的日志位置..."
    find /var/log -name "*.log" | grep -i mongo
fi

# 4. 检查MongoDB配置文件
 echo "
=== MongoDB配置文件 ==="
if [ -f "/etc/mongod.conf" ]; then
    cat /etc/mongod.conf
else
    echo "配置文件不存在: /etc/mongod.conf"
fi

# 5. 检查MongoDB数据目录权限
 echo "
=== MongoDB数据目录权限 ==="
data_path=$(grep -r "dbPath" /etc/mongod.conf 2>/dev/null | cut -d'=' -f2 | tr -d ' ') || echo "/var/lib/mongo (默认路径)"
if [ -d "$data_path" ]; then
    ls -la "$data_path"
else
    echo "数据目录不存在: $data_path"
fi

# 6. 尝试手动启动MongoDB并查看输出
 echo "
=== 尝试手动启动MongoDB ==="
sudo -u mongod mongod --config /etc/mongod.conf

# 7. 检查SELinux状态（如果适用）
if command -v sestatus &> /dev/null; then
    echo "
=== SELinux状态 ==="
    sestatus
fi

# 8. 检查防火墙规则
 echo "
=== 防火墙规则 ==="
if command -v firewall-cmd &> /dev/null; then
    firewall-cmd --list-all
elif command -v ufw &> /dev/null; then
    ufw status
fi

# 9. 检查MongoDB安装情况
 echo "
=== MongoDB安装情况 ==="
dpkg -l | grep mongo || rpm -qa | grep mongo

# 10. 总结
 echo "
=== 诊断总结 ==="
echo "请检查以上输出，特别是日志文件内容，以确定MongoDB启动失败的具体原因。"