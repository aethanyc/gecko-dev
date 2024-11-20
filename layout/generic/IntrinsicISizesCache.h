/* -*- Mode: C++; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2 -*- */
/* vim: set ts=2 sts=2 et sw=2 tw=80: */

#ifndef mozilla_IntrinsicISizesCache_h
#define mozilla_IntrinsicISizesCache_h

#include "nsIFrame.h"

namespace mozilla {

// Some classes keep a cache of intrinsic sizes.
struct IntrinsicISizesCache final {
  IntrinsicISizesCache() {
    new (&mInline) InlineCache();
    MOZ_ASSERT(IsInline());
  }

  ~IntrinsicISizesCache() { delete GetOutOfLine(); }

  template <typename Compute>
  nscoord GetOrSet(nsIFrame& aFrame, IntrinsicISizeType aType,
                   const IntrinsicSizeInput& aInput, Compute aCompute) {
    bool dependentOnPercentBSize = aFrame.HasAnyStateBits(
        NS_FRAME_DESCENDANT_INTRINSIC_ISIZE_DEPENDS_ON_BSIZE);
    nscoord value = Get(dependentOnPercentBSize, aType, aInput);
    if (value != kNotFound) {
      return value;
    }
    value = aCompute();
    // We might have just realized that we have a percent bsize dependency
    // cache.
    dependentOnPercentBSize = aFrame.HasAnyStateBits(
        NS_FRAME_DESCENDANT_INTRINSIC_ISIZE_DEPENDS_ON_BSIZE);
    value = std::max(value, 0);
    Set(dependentOnPercentBSize, aType, aInput, value);
    return value;
  }

  void Clear() {
    if (auto* ool = GetOutOfLine()) {
      ool->mPercentBasis.Clear();
      ool->mNonPercentBasis.Clear();
      ool->mLastPercentBasis.reset();
    } else {
      mInline.Clear();
    }
  }

 private:
  // We use nscoord_MAX rather than kNotFound as our sentinel
  // value so that our high bit is always free.
  static constexpr nscoord kNotFound = nscoord_MAX;

  static bool HasPercentBasis(const IntrinsicSizeInput& aInput) {
    return aInput.mPercentageBasisForChildren &&
           !aInput.mPercentageBasisForChildren->IsAllValues(
               NS_UNCONSTRAINEDSIZE);
  }

  nscoord Get(bool aDependentOnPercentBSize, IntrinsicISizeType aType,
              const IntrinsicSizeInput& aInput) const {
    if (!aDependentOnPercentBSize || !HasPercentBasis(aInput)) {
      if (auto* ool = GetOutOfLine()) {
        return ool->mNonPercentBasis.Get(aType);
      }
      return mInline.Get(aType);
    }
    if (auto* ool = GetOutOfLine()) {
      if (ool->mLastPercentBasis == aInput.mPercentageBasisForChildren) {
        return ool->mPercentBasis.Get(aType);
      }
    }
    return kNotFound;
  }

  void Set(bool aDependentOnPercentBSize, IntrinsicISizeType aType,
           const IntrinsicSizeInput& aInput, nscoord aValue) {
    MOZ_DIAGNOSTIC_ASSERT(aValue >= 0);
    const bool usePercentAwareCache =
        aDependentOnPercentBSize && HasPercentBasis(aInput);
    if (usePercentAwareCache) {
      auto* ool = EnsureOutOfLine();
      ool->mLastPercentBasis = aInput.mPercentageBasisForChildren;
      return ool->mPercentBasis.Set(aType, aValue);
    }
    if (auto* ool = GetOutOfLine()) {
      ool->mNonPercentBasis.Set(aType, aValue);
    } else {
      mInline.Set(aType, aValue);
      // No inline value should be able to turn us into out-of-line, because
      // intrinsic isizes should always be non-negative.
      MOZ_DIAGNOSTIC_ASSERT(IsInline());
    }
  }

  struct InlineCache {
    nscoord mCachedMinISize = kNotFound;
    nscoord mCachedPrefISize = kNotFound;

    nscoord Get(IntrinsicISizeType aType) const {
      return aType == IntrinsicISizeType::MinISize ? mCachedMinISize
                                                   : mCachedPrefISize;
    }
    void Set(IntrinsicISizeType aType, nscoord aValue) {
      if (aType == IntrinsicISizeType::MinISize) {
        mCachedMinISize = aValue;
      } else {
        mCachedPrefISize = aValue;
      }
    }

    void Clear() { *this = {}; }
  };

  struct OutOfLineCache {
    InlineCache mNonPercentBasis;
    InlineCache mPercentBasis;
    Maybe<LogicalSize> mLastPercentBasis;
  };

  // If the high bit of mOutOfLine is 1, then it points to an OutOfLineCache.
  union {
    InlineCache mInline;
    uintptr_t mOutOfLine = 0;
  };

  static constexpr uintptr_t kHighBit = uintptr_t(1) << (sizeof(void*) * 8 - 1);

  bool IsOutOfLine() const { return mOutOfLine & kHighBit; }
  bool IsInline() const { return !IsOutOfLine(); }
  OutOfLineCache* EnsureOutOfLine() {
    if (auto* ool = GetOutOfLine()) {
      return ool;
    }
    auto inline_ = mInline;
    auto* ool = new OutOfLineCache();
    ool->mNonPercentBasis = inline_;
    mOutOfLine = reinterpret_cast<uintptr_t>(ool) | kHighBit;
    return ool;
  }

  OutOfLineCache* GetOutOfLine() const {
    return IsOutOfLine()
               ? reinterpret_cast<OutOfLineCache*>(mOutOfLine & ~kHighBit)
               : nullptr;
  }
};
}  // namespace mozilla

#endif
