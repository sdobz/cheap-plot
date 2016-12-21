Cheap Hanging Plotter
=====================

Hardware design
===============
* esp 8266 (arduinolike)
* latched shift register
* stepper drivers
* steppers
* timing pulleys
* timing belt
* hanging pen
* servo lifter
* 3d printed brackets

Software design
===============
* esp hosts webserver
* html + js
* stream gcode to esp
* esp plans steps

Software problems
=================
* [Realtime Arduino](https://forum.arduino.cc/index.php?topic=138643.0) for stepper timing
* OTA Updates
* WIFI ap, config, connect
* Stepper latching

Step planner
------------
* Each stepper has a pulley with a length, this describes a circle
* Stepping forward describes a larger one, backward a smaller
* Cast a ray from the current position in the intended direction
* Use dot product of pulley segment and motion segment to determine step direction
* Intersect the ray with the described future circles
* Calculate the delay until the step is required
* Choose the lesser number, wait, step

Optimization
* Step delay depends on relative angle and distance
* Precalculate them, lookup, multiply

Frontend
--------
Configure, upload, visualize

TODO
====
* Jump to start of line
* Pick step direction
* Plot next step position
* Loop plotting points

