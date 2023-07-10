# MIDI Router

![Image of MIDI Router device](img/MidiRouter.png)

## What is this?
Max for Live device for routing MIDI I/O in audio tracks for audio effect devices or plugins which have MIDI input.

## Download
https://maxforlive.com/library/device/7509/midi-router

## Requirements
- Ableton Live 11.0.5 / Cycling '74 Max 8.1.11 or later

## Parameters
- `MIDI Input Type` Selects MIDI input type from MIDI tracks or external MIDI devices. Just like 'MIDI From' of MIDI tracks.
- `MIDI Input Channel` Selects MIDI Input Channel from selected input type above.
Available only when MIDI Input Type has selectable channels.
- `Send` Switches if the device route MIDI messages via I/O. M4L devices send MIDI messages even if inactive
(imagine normal effect devices in MIDI/audio chain), thus let the Send button off if you want to stop sending messages.
- `MIDI Output Type` Selects MIDI Output type from MIDI tracks or external MIDI devices. Just like 'MIDI To' of MIDI tracks.
- `MIDI Output Channel` Selects MIDI Output Channel or device from selected output type above.
Available only when MIDI Output Type has selectable channels or devices.

## Known Issues
See [Issues](https://github.com/h1data/M4L-MidiRouter/issues?q=) section.