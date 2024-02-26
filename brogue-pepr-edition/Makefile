include config.mk
.PHONY: copy-js
cflags := -Isrc/brogue -Isrc/platform -Isrc/variants -std=c99 \
    -Wall -Wpedantic -Wno-error=implicit -Wno-parentheses -Wno-unused-result \
    -Wformat -I/opt/homebrew/Cellar/libmicrohttpd/1.0.0/include \
    -I/opt/homebrew/Cellar/jansson/2.14/include \
	-I/opt/homebrew/include/SDL2 -D_THREAD_SAFE \
	-I/opt/homebrew/opt/sdl2/include/SDL2 -I/opt/homebrew/opt/sdl2_image/include/SDL2 \

libs := -lm -L/opt/homebrew/Cellar/libmicrohttpd/1.0.0/lib -L/opt/homebrew/Cellar/jansson/2.14/lib -lmicrohttpd -ljansson -lpthread -L/opt/homebrew/lib -lSDL2 -lSDL2_image -L/opt/homebrew/opt/sdl2/lib -L/opt/homebrew/opt/sdl2_image/lib -lSDL2 -lSDL2_image 
cppflags := -DDATADIR=$(DATADIR)

sources := $(wildcard src/brogue/*.c) $(wildcard src/variants/*.c) $(addprefix src/platform/,main.c platformdependent.c null-platform.c)
objects :=

ifeq ($(SYSTEM),WINDOWS)
objects += windows/icon.o
.exe := .exe
endif

ifeq ($(SYSTEM),OS2)
cflags += -march=pentium4 -mtune=pentium4 -Zmt -Wno-narrowing
cppflags += -D__ST_MT_ERRNO__
libs += -lcx -lc -Zomf -Zbin-files -Zargs-wild -Zargs-resp -Zhigh-mem -Zstack 8000
objects += os2/icon.res os2/brogue.lib
.exe := .exe
endif

ifeq ($(RELEASE),YES)
extra_version :=
else
extra_version := $(shell bash tools/git-extra-version)
endif
cppflags += -DBROGUE_EXTRA_VERSION='"$(extra_version)"'

ifeq ($(TERMINAL),YES)
sources += $(addprefix src/platform/,curses-platform.c term.c)
cppflags += -DBROGUE_CURSES
libs += -lncurses
ifeq ($(SYSTEM),OS2)
libs += -ltinfo
endif
endif

ifeq ($(GRAPHICS),YES)
sources += $(addprefix src/platform/,sdl2-platform.c tiles.c)
cflags += $(shell $(SDL_CONFIG) --cflags)
cppflags += -DBROGUE_SDL
libs += $(shell $(SDL_CONFIG) --libs) -lSDL2_image
endif

ifeq ($(WEBBROGUE),YES)
sources += $(addprefix src/platform/,web-platform.c)
cppflags += -DBROGUE_WEB
endif

ifeq ($(RAPIDBROGUE),YES)
cppflags += -DRAPID_BROGUE
endif

ifeq ($(MAC_APP),YES)
cppflags += -DSDL_PATHS
endif

ifeq ($(DEBUG),YES)
cflags += -g -Og
cppflags += -DENABLE_PLAYBACK_SWITCH
else
cflags += -O2
endif

# Add user-provided flags.
cflags += $(CFLAGS)
cppflags += $(CPPFLAGS)
libs += $(LDLIBS)

objects += $(sources:.c=.o)

# Copy js files from src/client to the bin directory
JS_FILES := $(wildcard src/client/*.js)
COPIED_JS_FILES := $(patsubst src/client/%,bin/client/%,$(JS_FILES))

copy-js: $(COPIED_JS_FILES)
	@echo "Copying JS files..."

$(COPIED_JS_FILES): bin/client/%: src/client/%
	@echo "Copying $< to $@"
	@mkdir -p bin/client
	cp src/client/*.js bin/client

$(info JS_FILES=$(JS_FILES))

include make/*.mk
#.DEFAULT_GOAL := bin/brogue$(.exe)

.DEFAULT_GOAL := all
all: bin/brogue$(.exe) copy-js

#.DEFAULT_GOAL := bin/brogue$(.exe) copy-js

clean:
	$(warning 'make clean' is no longer needed in many situations, so is not supported. Use 'make -B' to force rebuild something.)

escape = $(subst ','\'',$(1))
vars:
	mkdir -p vars
# Write the value to a temporary file and only overwrite if it's different.
vars/%: vars FORCE
	@echo '$(call escape,$($*))' > vars/$*.tmp
	@if cmp --quiet vars/$*.tmp vars/$*; then :; else cp vars/$*.tmp vars/$*; fi


FORCE:
