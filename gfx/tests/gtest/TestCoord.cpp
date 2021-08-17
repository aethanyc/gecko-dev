/* -*- Mode: C++; tab-width: 8; indent-tabs-mode: nil; c-basic-offset: 2 -*- */
/* vim: set ts=8 sts=2 et sw=2 tw=80: */
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
#include <limits>

#include "gtest/gtest.h"

#include "Units.h"

using mozilla::CSSIntCoord;

template <class IntCoordTyped>
static void TestConstructors() {
  IntCoordTyped coord1 = 10;
  EXPECT_EQ(coord1.value, 10);

  IntCoordTyped coord2 = -20;
  EXPECT_EQ(coord2.value, -20);
}

template <class IntCoordTyped>
static void TestComparisonOperator() {
  IntCoordTyped coord1 = 10;
  IntCoordTyped coord2 = 25;

  EXPECT_GE(coord2, coord1);
}

TEST(Gfx, CSSIntCoord)
{
  TestConstructors<CSSIntCoord>();
  TestComparisonOperator<CSSIntCoord>();
}
