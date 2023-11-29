<h1 align="center">Pomodoro Timer for Obsidian</h1>

## Introduction
This plugin integrates a customizable Pomodoro timer into your Obsidian workspace, helping you focus and manage your time effectively.

## Features

- **Customizable Timer**: Set your work and break intervals to suit your productivity style.
- **Audible Alerts**: Stay on track with audio notifications signaling the end of each session.
- **Status Bar Display**: Monitor your progress directly from Obsidian's status bar to keep focusing.
- **Daily Note Integration**: Automatically log your sessions in your daily notes for better tracking.

## Screenshots

![image](https://github.com/eatgrass/obsidian-pomodoro-timer/assets/2351076/67a0e6fd-6e3d-42b3-a42c-c56602f8135d)

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
- [ ] My Awesome Task
    - 🍅 (pomodoro::WORK) (duration:: 1m) (begin:: 2023-11-29 13:58) - (end:: 2023-11-29 14:01)
    - 🥤 (pomodoro::BREAK) (duration:: 22m) (begin:: 2023-11-29 13:36) - (end:: 2023-11-29 14:01)
    - 🥤 (pomodoro::BREAK) (duration:: 22m) (begin:: 2023-11-29 13:38) - (end:: 2023-11-29 14:01)
    - 🍅 (pomodoro::WORK) (duration:: 1m) (begin:: 2023-11-29 14:01) - (end:: 2023-11-29 14:03)
    - 🍅 (pomodoro::WORK) (duration:: 1m) (begin:: 2023-11-29 14:01) - (end:: 2023-11-29 14:03)
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

[![coffee](https://img.buymeacoffee.com/button-api/?text=Buy%20me%20a%20coffee&emoji=%E2%98%95&slug=eatgrass&button_colour=FFDD00&font_colour=000000&font_family=Comic&outline_colour=000000&coffee_colour=ffffff)](https://www.buymeacoffee.com/eatgrass)
