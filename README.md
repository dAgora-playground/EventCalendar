# Sync Cori Events to Google Calendar

此项目用于将 Cori 创建的 Event 从 Crossbell 链自动添加到指定的 Google 日历。

## 如何使用

### 在使用此项目之前，请首先安装以下依赖项：

`npm install googleapis google-auth-library axios`

### 准备资料

- 注册 google “server account”，配置正确的权限，并下载 key 文件。将文件保存为`service-account-keys.json`存放在项目根目录。
- 指定写入的 Google 日历，并给予上述 server account 编辑权限。
- 在项目根目录下创建`existing-events.json`和`config.json`文件。`existing-events.json`文件初始为空，用于存储已同步的活动的 ID。`config.json`文件应包含如下内容：
  {
  "calendarId": "Google 日历 ID"
  "crossbellEventUrl": "需要同步的 eventlist 接口地址"
  }

### 运行

在终端中运行以下命令启动程序：`node main.js`

如果你希望此程序定期自动运行（例如，每 5 分钟运行一次），你可以在服务器上使用 cron 或其他定时任务工具来实现。

## 其他注意事项

为了安全，你应该在.gitignore 文件中包含你的 service-account-keys.json，existing-events.json 和 config.json 文件，以防止这些敏感信息被公开。在部署项目时，你需要手动将这些文件上传到服务器。

如果你有任何问题或需要进一步的帮助，随时告诉我！

## License

This project is licensed under the MIT License.
