// In Monsters.h
#ifndef MONSTERS_H
#define MONSTERS_H

#include "Rogue.h"
#include "GlobalsBase.h"
#include "Globals.h"
#include "Monsters.h"
#include <string.h>
#include <unistd.h>
#include <stdbool.h> // bool

creature *findDecedent(const char *name);
boolean findCreature(const char *name);


#endif // MONSTERS_H
