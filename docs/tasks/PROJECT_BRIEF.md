# Sea Radar — Client Brief

**Client:** “Nord-West” maritime training center, navigation theory department.
**Contact:** Department methodologist.
**What we are commissioning:** a small program for demonstrating vessel movement during lessons.

---

## 1. Why We Need This

In lessons on the fundamentals of navigation, we explain to cadets how to read conditions on the water: where vessels are going, on what course, at what speed, and how this changes over time. This works best with a live example—real vessels in a real strait.

We currently open public vessel-tracking websites. This works poorly during a lesson: there are ads, the whole world is on the screen, vessel details are available only after registration, the interface is overloaded, and the instructor has no control over exactly what the cadets see. We waste time fighting the website instead of teaching.

We need our own simple tool that runs on the instructor's laptop and shows one thing: a map of one strait and vessels on it.

## 2. Who Will Use It

**Instructor.** Opens the program before class, displays it on a projector, clicks on vessels, and explains. Not a programmer, but comfortable using a computer. It's important that everything starts the same way every time and doesn't break in the middle of an explanation.

**Cadets.** Watch the screen. They don't use the program themselves.

One person uses the program on one computer at a time. We don't need multiple users, password login, or a shared server.

## 3. How We Imagine a Lesson

The instructor launches the program and opens it in a browser. The screen shows a map of the Strait of Dover—the narrowest part of the English Channel, one of the busiest shipping routes in the world; we use it as a teaching example. While the instructor explains course and speed, several training (fictional) vessels move across the map—this is necessary so we don't depend on whether there is traffic or internet at that moment.

When the explanation moves on to real conditions, the instructor presses a button—and the program shows the real vessels currently in the strait. The instructor clicks on a vessel and shows the cadets its data: name, coordinates, speed, course, and time of the last message.

It's important that the program clearly state what it is showing: training or real data, when it was received, and that it is not a complete picture—but only the vessels for which messages were received.

## 4. Where to Get Real Data

Vessels transmit their positions using the AIS system. We found a free source of this data—the AISStream service (aisstream.io). It requires an access key; we will register a key in our name and provide it to the developer. The key must be stored so it cannot be seen in the program, and it must not be made publicly available.

We understand that a free service does not guarantee availability and that there may be few vessels in the strait at some point. The program should handle this gracefully: training vessels must still work without a key or connection, and if real data cannot be retrieved, it should clearly explain what happened.

We don't need a continuous stream—a snapshot at the moment the button is pressed is enough: collect data for a few seconds and show a reasonable number of vessels. We are not a monitoring center.

## 5. What the Program Must Do

Below are the user stories. Under each one is how we will know it has been completed.

### US-01. Open the Strait Map

As an instructor, I open the program and see a map of the Strait of Dover, so I can start the lesson without configuration.

Accepted if: the program launches with one command on a laptop; a map of the correct area opens in the browser; the map can be panned and zoomed; the map does not break when the page is refreshed or the window is resized; the map shows the source of the map itself and its contributors.

### US-02. See Training Vessels

As an instructor, I see three training vessels on the map so I can explain course and speed even if real data is not available.

Accepted if: when the program opens, there are three vessels on the map with clear training names; each is marked with an icon rotated in the direction of movement; it is clear that the data is for training.

### US-03. Observe Training Vessel Movement

As an instructor, I see training vessels move along their routes so I can demonstrate how position changes over time.

Accepted if: vessels visibly move every few seconds; the icon rotates in the direction of movement; when a vessel reaches the end of its route, it stops and remains there; after the page is refreshed, movement starts from the beginning. Pause, rewind, and replay are not needed.

### US-04. Open a Vessel Card

As an instructor, I click on a vessel and see its data so I can discuss a specific example with the cadets.

Accepted if: clicking opens a card with the vessel's identification number (MMSI), name, coordinates, speed in knots, course in degrees, time of the last message, and an indication of where the data came from; the card shows exactly the vessel that was clicked and does not switch to another by itself; if the vessel is moving, the card updates along with it; if a value is unknown, it says “No data,” not zero. Zero speed means the vessel is stationary, and is displayed as zero.

### US-05. Load Real Vessels

As an instructor, I press a button and see the real vessels currently in the strait on the map so I can move from the training example to real conditions.

Accepted if: there is one clear button; after it is pressed, the program collects data for a few seconds and shows the vessels received on the same map with the same icons; while collection is in progress, the button cannot be pressed a second time; clicking a real vessel opens the same kind of card; if I click a real vessel and then load again, the program does not confuse the vessels.

### US-06. Understand What I Am Seeing

As an instructor, I want to see a label indicating where the data came from and when it was received, so I don't present an outdated or incomplete picture as current to the cadets.

Accepted if: the map always has a nearby label saying whether the data is training or real; for real data, the time it was received and the number of vessels received are indicated; it is clearly stated that these are not all vessels in the area, but only those for which messages arrived during the collection period; real vessels do not “move along” between loads—they remain where they were when received; for each vessel, the most recent message by time is shown, not an arbitrary one.

### US-07. Understand When It Didn't Work

As an instructor, I want a clear message if real data could not be retrieved so I don't have to guess or restart the program.

Accepted if: when the key is missing, there is no connection, or the source returns an error, a clear explanation of the reason appears on screen; if no messages arrive during the collection period, the program says so rather than displaying “no vessels”; training vessels work again after the page is refreshed.

### US-08. Use the Training Part Without Internet

As an instructor, I want training vessels and cards to work without a key and without a connection to the data source so the lesson is not disrupted.

Accepted if: the program launches and shows training vessels without a configured key; an attempt to load real data without a key ends with a clear message, not a program error.

### US-09. Trust the Data

As a methodologist, I want to be confident that the program does not distort the data so cadets don't learn from mistakes.

Accepted if the developer demonstrates reproducible checks rather than just describing them: if multiple messages arrive for a vessel, the most recent one by time is shown; the same vessel is not shown twice; unknown speed or course is displayed as “No data,” not zero; a vessel without valid coordinates does not appear on the map at all; collection is genuinely limited by time and quantity; if the connection is interrupted during collection, the program reports this rather than showing a partial result.

### US-10. Install It Independently

As an instructor, I want to install the program on another laptop using a short set of instructions so I don't depend on a single computer.

Accepted if: the package includes instructions that let someone install and run the program without help from the developer; the instructions say where to enter the key, how to check that everything works, and what the program can and cannot do.

## 6. What We Don't Need

So the developer doesn't spend time on unnecessary work:

- zones, alerts, notifications when vessels enter an area;
- movement history, tracks, playback of the past;
- searching for vessels by name, filters;
- multiple areas and switching between them;
- saving settings between launches;
- continuous real-time updates—only a snapshot on button press;
- password login, multiple users, access over the internet from other computers;
- deployment to a server or cloud—everything runs on the laptop;
- recommendations, forecasts, “smart” features;
- use for real navigation—this is a teaching aid.

## 7. Constraints

- The program runs only on the instructor's computer and is not exposed externally.
- The data access key must not end up in the source code, in files delivered to us, or on screen.
- Vessel names are entered by their crews and could contain anything—the program displays the name as text, exactly as provided, and must not break because of it.
- Internet is required for the map and real data; fully offline map operation is not required.
- There is one fixed area. If the instructor accidentally pans the map, the button must still show vessels from the strait.

## 8. How We Want to Receive the Result

We want to see a working program in stages, not all at the end:

1. **First** — the map and training vessels with cards (US-01…US-04). This is already usable in a lesson.
2. **Then** — real vessels via a button, with labels and error messages (US-05…US-08).
3. **Finally** — evidence that the data is not being distorted (US-09).

We expect the installation instructions (US-10) with the final handoff.

After each stage, we want to receive a version that we can run and inspect, and a short description of what was done, what was checked, and what is still missing. If we have clarifications during the process, we will send them in a separate email rather than rewrite this brief.

## 9. How We Will Accept It

- Launch the program on our laptop using the instructions.
- Manually walk through stories US-01…US-08.
- Review the checks for US-09 and confirm that they actually run and pass.
- Verify that the training part works without a key, and that with a key, real vessels were loaded at least once—or the developer honestly demonstrates that the source was unavailable at that time.
- Confirm that the key is not in the delivered files.

## 10. What We Don't Know Ourselves

- How stable the free source is and how many vessels it provides for the strait at different times of day. If there are too few, that's not a complaint about the developer, but the program must show this honestly.
- What the free service's terms are and what they allow the developer to do—we ask that these be checked before use.
