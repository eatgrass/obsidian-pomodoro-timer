<h1 align="center">Pomodoro Timer for Obsidian</h1>

## Introduction

This plugin integrates a customizable Pomodoro timer into your Obsidian workspace, helping you focus and manage your time effectively.

## Features

-   **Customizable Timer**: Set your work and break intervals to suit your productivity style.
-   **Audible Alerts**: Stay on track with audio notifications signaling the end of each session.
-   **Status Bar Display**: Monitor your progress directly from Obsidian's status bar to keep focusing.
-   **Daily Note Integration**: Automatically log your sessions in your daily notes for better tracking.

## Log

### Default Log

The standard log format is as follows, and it's important to note that logging **only occurs once a session is complete.**
For those requiring more detailed logging, consider setting up a custom [log template](#Custom Log Template) as described below.

```plain
- 🍅 (pomodoro::WORK) (duration:: 1m) (begin:: 2023-12-20 15:57) - (end:: 2023-12-20 15:58)
- 🥤 (pomodoro::BREAK) (duration:: 1m) (begin:: 2023-12-20 16:06) - (end:: 2023-12-20 16:07)
```

### Custom Log Template (Optional)

1. Install the [Templater](https://github.com/SilentVoid13/Templater) plugin.
2. Compose your log template using the `log` object, which stores session information.

```json
{
	duration: number,  // duratin in minutes
	session: number,   // session length
	finished: boolean, // if the session is finished?
	mode: string,      // 'WORK' or 'BREAK'
	begin: Moment,     // start time
	end: Moment        // end time
}
```
here is an example

```javascript
<%*
if (log.mode == "WORK") {
  if (!log.finished) {
    tR = `🟡 Focused ${log.duration} / ${log.session} minutes`;
  } else {
    tR = `🍅 Focused ${log.duration} / minutes`;
  }
} else {
  tR = `☕️ Took a break from ${log.begin.format("HH:mm")} to ${log.end.format(
    "HH:mm"
  )}`;
}
%>
```

## Screenshots

![image](https://github.com/eatgrass/obsidian-pomodoro-timer/assets/2351076/f2f4f339-ba66-423f-b6a5-79fe91e13ef0)

## Examples of Using with DataView

### Log Table

This DataView script generates a table showing Pomodoro sessions with their durations, start, and end times.

![image](https://github.com/eatgrass/obsidian-pomodoro-timer/assets/2351076/ebcf33ac-291e-4659-ab03-93bfbe1c79d3)

<pre>
```dataviewjs
const pages = dv.pages()
const table = dv.markdownTable(['Pomodoro','Duration', 'Begin', 'End'],
pages.file.lists
.filter(item=>item.pomodoro)
.sort(item => item.end, 'desc')
.map(item=> {

    return [item.pomodoro, `${item.duration.as('minutes')} m`, item.begin, item.end]
})
)
dv.paragraph(table)

```  
</pre>

### Summary View

This DataView script presents a summary of Pomodoro sessions, categorized by date.

![image](https://github.com/eatgrass/obsidian-pomodoro-timer/assets/2351076/84119bb0-c78e-4716-9a76-ffa72d94a587)

<pre>
```dataviewjs
const pages = dv.pages();
const emoji = "🍅";
dv.table(
  ["Date", "Pomodoros", "Total"],
  pages.file.lists
    .filter((item) => item?.pomodoro == "WORK")
    .groupBy((item) => {
      if (item.end && item.end.length >= 10) {
        return item.end.substring(0, 10);
      } else {
        return "Unknown Date";
      }
    })
    .map((group) => {
      let sum = 0;
      group.rows.forEach((row) => (sum += row.duration.as("minutes")));
      return [
        group.key,
        group.rows.length > 5
          ? `${emoji}  ${group.rows.length}`
          : `${emoji.repeat(group.rows.length)}`,
        `${sum} min`,
      ];
    })
)
```
</pre>

### Task Tracking

Enhance your tasks with Pomodoro logs as sublists. Each entry details the type of session, duration, and timestamps.

```markdown
# add logs as sublist of your task

-   [ ] My Awesome Task
    -   🍅 (pomodoro::WORK) (duration:: 1m) (begin:: 2023-11-29 13:58) - (end:: 2023-11-29 14:01)
    -   🥤 (pomodoro::BREAK) (duration:: 22m) (begin:: 2023-11-29 13:36) - (end:: 2023-11-29 14:01)
    -   🥤 (pomodoro::BREAK) (duration:: 22m) (begin:: 2023-11-29 13:38) - (end:: 2023-11-29 14:01)
    -   🍅 (pomodoro::WORK) (duration:: 1m) (begin:: 2023-11-29 14:01) - (end:: 2023-11-29 14:03)
    -   🍅 (pomodoro::WORK) (duration:: 1m) (begin:: 2023-11-29 14:01) - (end:: 2023-11-29 14:03)
```

![image](https://github.com/eatgrass/obsidian-pomodoro-timer/assets/2351076/2c0c9852-fd86-4390-8519-7cb3a049ec28)

<pre>
```dataviewjs
const pages = dv.pages();
const emoji = "🍅";
dv.table(
  ["Task", "Pomodoros", "Total"],
  pages.file.tasks
    .filter((task) => task.children.some((child) => child.pomodoro == "WORK"))
    .map((task) => {
      let p = task.children
        .filter((child) => child.pomodoro == "WORK")
        .map((child) => child.duration.as("minutes"));
      let sum = p
        .reduce((a, b) => a+b,0)
      let pomodoros =
        p.length > 5 ? `${emoji} ${p.length}` : `${emoji.repeat(p.length)}`;
      return [task.text, pomodoros, `${sum} minutes`];
    })
)
```
</pre>

[<img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="BuyMeACoffee" width="100">](https://www.buymeacoffee.com/eatgrass)
