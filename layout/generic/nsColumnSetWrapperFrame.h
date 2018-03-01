/* -*- Mode: C++; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2 -*- */
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/* Frame for css multi-column layout that contains column sets and column spans. */

#ifndef nsColumnSetWrapperFrame_h_
#define nsColumnSetWrapperFrame_h_

#include "nsContainerFrame.h"

/* This class is a wrapper for nsColumnSetFrames and column-span elements i.e.
 * spanners. Essentially, we divide the *original* nsColumnSetFrame
 * into multiple nsColumnSetFrames on the basis of the number and position of
 * spanning elements.
 * This wrapper is necessary for implementing column-span as it allows us to
 * maintain each nsColumnSetFrame as an independent set of columns and each
 * spanning element then becomes just a block level element.
 */
class nsColumnSetWrapperFrame final : public nsBlockFrame
{
public:
  NS_DECL_FRAMEARENA_HELPERS(nsColumnSetWrapperFrame)

  friend nsBlockFrame* NS_NewColumnSetWrapperFrame(nsIPresShell* aPresShell,
                                                   nsStyleContext* aContext,
                                                   nsFrameState aStateFlags);

  virtual nsContainerFrame* GetContentInsertionFrame() override {
    MOZ_ASSERT_UNREACHABLE("Should not be called because we don't know whether"
                           " we're inserting a column-span or not.");
  }

#ifdef DEBUG_FRAME_DUMP
  nsresult GetFrameName(nsAString& aResult) const override {
    return MakeFrameName(NS_LITERAL_STRING("ColumnSetWrapper"), aResult);
  }
#endif

  void AppendFrames(ChildListID aListID, nsFrameList& aFrameList) override;

  void InsertFrames(ChildListID  aListID,
                    nsIFrame*    aPrevFrame,
                    nsFrameList& aFrameList) override;

  void RemoveFrame(ChildListID aListID, nsIFrame* aOldFrame) override;

private:
  explicit nsColumnSetWrapperFrame(nsStyleContext* aContext);
  ~nsColumnSetWrapperFrame() override
  {
  }

};

#endif /* nsColumnSetWrapperFrame_h_ */
