<h1 align="center">Pomodoro Timer for Obsidian</h1>

## Features

- Customizable work and break time length
- Audible notifications
- A timer displayed in the status bar
- Integration with your daily note for logging

## Screenshots

![image](https://github.com/eatgrass/obsidian-pomodoro-timer/assets/2351076/c88352da-aeed-42f9-a307-60bf91db2754)

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

![image](https://github.com/eatgrass/obsidian-pomodoro-timer/assets/2351076/538d6b11-c6c7-4660-a401-0d4d42fc8b84)

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
        .map((child) => child.duration);
      let sum = p
        .reduce((t, a) => t.plus(a), Duration.fromObject({}))
        .as("minutes");
      let pomodoros =
        p.length > 5 ? `${emoji} ${p.length}` : `${emoji.repeat(p.length)}`;
      return [task.text, pomodoros, sum];
    })
)
```
</pre>
