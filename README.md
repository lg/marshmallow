Marshmallow by Larry Gadea (trivex@gmail.com, twitter.com/lg)

An OpenSource Campfire(TM, i think?) server.


DESCRIPTION
-----------

You might have heard of Campfire by 37signals. This is an implementation of
their backend in C. This server is written using libevent and all that goodness.
Benchmarked at 10000req/s on a macbook -- serving beautiful static content!

Also, yes, I realize that a large part of this project is client-side. I'll
get .. something .. done for that. Meanwhile, you're stuck with templates
swiped from 37signals. I'm trying to keep the swiping to a minimum tho, just so 
that Propane can parse it.


CURRENT STATUS
--------------

You get a room listing of rooms you can't join!


QUICK START
-----------

- Make sure you have the libevent libs installed from `http://www.monkey.org/~provos/libevent/`
- To build, use: `gcc main.c -levent -fasm-blocks`
- To run, use: `sudo ./a.out`. Sudo is needed to bind on port 80
- To prepare, add `127.0.0.1 marshmallow.campfirenow.com` to your `/etc/hosts` file
- To use, install and open Propane and add `marshmallow.campfirenow.com` to it


LEGAL
-----

Please send your cease and desist to trivex@gmail.com. Otherwise, I'd love
to hear comments/suggestions too!

Oh and feel free to steal my code.