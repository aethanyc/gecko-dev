/* -*- Mode: C++; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2 -*- */
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/* Frame for css multi-column layout that contains column sets and column spans. */

#include "nsColumnSetWrapperFrame.h"

using namespace mozilla;

nsBlockFrame*
NS_NewColumnSetWrapperFrame(nsIPresShell*   aPresShell,
                            nsStyleContext* aContext,
                            nsFrameState    aStateFlags)
{
  nsColumnSetWrapperFrame* frame =
    new (aPresShell) nsColumnSetWrapperFrame(aContext);
  frame->AddStateBits(aStateFlags | NS_BLOCK_MARGIN_ROOT);
  return frame;
}

NS_IMPL_FRAMEARENA_HELPERS(nsColumnSetWrapperFrame)

nsColumnSetWrapperFrame::nsColumnSetWrapperFrame(nsStyleContext* aContext)
: nsBlockFrame(aContext, kClassID)
{
}

void
nsColumnSetWrapperFrame::AppendDirectlyOwnedAnonBoxes(nsTArray<OwnedAnonBox>& aResult)
{
  if (mFrames.NotEmpty()) {
    aResult.AppendElement(OwnedAnonBox(mFrames.FirstChild()));
  }
}

/*
 * Any append, insert or remove operation is disallowed on ColumnSetWrapperFrame
 * because in that case we must recreate the entire frame hierarchy under this
 * wrapper to account for the added/removed element changing the breaking of
 * frames across column-spans. This is handled in nsCSSFrameConstructor's
 * ContentAppended/ContentRemoved/ContentInserted path.
 * See nsCSSFrameConstructor::WipeContainingBlock.
 */
void
nsColumnSetWrapperFrame::AppendFrames(ChildListID     aListID,
                                      nsFrameList&    aFrameList)
{
  MOZ_CRASH("unsupported operation");
}

void
nsColumnSetWrapperFrame::InsertFrames(ChildListID     aListID,
                                      nsIFrame*       aPrevFrame,
                                      nsFrameList&    aFrameList)
{
  MOZ_CRASH("unsupported operation");
}

void
nsColumnSetWrapperFrame::RemoveFrame(ChildListID     aListID,
                                     nsIFrame*       aOldFrame)
{
  MOZ_CRASH("unsupported operation");
}
