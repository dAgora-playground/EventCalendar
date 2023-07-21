// 引入需要的模块
const { google } = require("googleapis");
const { JWT } = require("google-auth-library");
const keys = require("./service-account-keys.json");
const axios = require("axios");
const fs = require("fs");
const config = require("./config.json");
const path = require("path");


// 设置全局常量
const fn = "existing-events.json";
const existingEventsFile = path.resolve(__dirname, fn);
console.log(fn,existingEventsFile)


const EVENT_DURATION_MINUTES = 60;

// 初始化 Google Calendar 客户端
const client = new google.auth.JWT(keys.client_email, null, keys.private_key, [
  "https://www.googleapis.com/auth/calendar",
]);

const calendar = google.calendar({ version: "v3", auth: client });

// 从文件中读取已经存在的事件
function readExistingEventsFromFile() {
  let existingEventsSet;
  try {
    let rawData = fs.readFileSync(existingEventsFile, "utf8");
    if (rawData.trim() === "") {
      existingEventsSet = new Set(); // 如果文件为空，初始化一个空的 Set
    } else {
      existingEventsSet = new Set(JSON.parse(rawData));
    }
  } catch (error) {
    if (error.code === "ENOENT") {
      existingEventsSet = new Set(); // 如果文件不存在，初始化一个空的 Set
    } else {
      console.error("Error reading or parsing existingEventsFile:", error);
    }
  }
  return existingEventsSet;
}

let existingEventsSet = readExistingEventsFromFile();

// 更新已经存在的事件，并写入文件
function updateExistingEvents(eventId) {
  existingEventsSet.add(eventId);
  fs.writeFileSync(
    existingEventsFile,
    JSON.stringify(Array.from(existingEventsSet))
  );
}

// 从 API 获取所有的事件
async function getAllEventsFromAPI() {
  const response = await axios.get(config.crossbellEventUrl);
  return response.data;
}

// 查找新的事件
async function findNewEvents() {
  let allEvents = await getAllEventsFromAPI();
  let newEvents = [];
  if (!allEvents || !allEvents.list) {
    console.error(
      "getAllEventsFromAPI did not return expected data:",
      allEvents
    );
    return newEvents;
  }
  allEvents.list.forEach((event) => {
    let eventId = `${event.characterId}-${event.noteId}`;
    if (!existingEventsSet.has(eventId)) {
      newEvents.push(event);
      existingEventsSet.add(eventId);
    }
  });
  return newEvents;
}

// 主函数
async function main() {
  let newEvents = await findNewEvents();
  newEvents.forEach(createAndInsertEvent);
}

// 创建并插入事件
function createAndInsertEvent(coriEvent) {
  const metadata = coriEvent.metadata;
  const timeString = metadata.content.attributes.find(attr => attr.trait_type === 'time')?.value;
  if(!timeString) {
    console.error('No time found in event:', coriEvent);
    return;
  }
  const startTime = new Date(timeString);
  const endTime = new Date(
    startTime.getTime() + EVENT_DURATION_MINUTES * 60000
  ); // 设置事件的结束时间
  const title = metadata.content.title;
  const url =
    "https://zuzu-log.vercel.app/event/" +
    coriEvent.characterId +
    "/" +
    coriEvent.noteId;
  const description = metadata.content.content;

  // 构建 Google Calendar 事件
  const event = {
    summary: title,
    start: {
      dateTime: startTime,
    },
    end: {
      dateTime: endTime,
    },
    description: description + "\n" + "\n" + url,
    // location: location,
  };

  // 插入事件
  calendar.events.insert(
    {
      auth: client,
      calendarId: config.calendarId,
      resource: event,
    },
    (err, event) => {
      if (err) {
        console.log(
          "There was an error contacting the Calendar service: " + err
        );
        return;
      }
      console.log("Event created");
      updateExistingEvents(`${coriEvent.characterId}-${coriEvent.noteId}`); // 更新事件
    }
  );
}

// 授权客户端
client.authorize(function (err) {
  if (err) {
    console.log("Error authorizing client:", err);
    return;
  }
  console.log("Successfully connected!");
  main(); // 在成功授权后调用主函数
});
