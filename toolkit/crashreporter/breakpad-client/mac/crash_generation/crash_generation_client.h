// Copyright (c) 2010 Google Inc.
// All rights reserved.
//
// Redistribution and use in source and binary forms, with or without
// modification, are permitted provided that the following conditions are
// met:
//
//     * Redistributions of source code must retain the above copyright
// notice, this list of conditions and the following disclaimer.
//     * Redistributions in binary form must reproduce the above
// copyright notice, this list of conditions and the following disclaimer
// in the documentation and/or other materials provided with the
// distribution.
//     * Neither the name of Google Inc. nor the names of its
// contributors may be used to endorse or promote products derived from
// this software without specific prior written permission.
//
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
// "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
// LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
// A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
// OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
// SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
// LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
// DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
// THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
// (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
// OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

#ifndef GOOGLE_BREAKPAD_CLIENT_MAC_CRASH_GENERATION_CRASH_GENERATION_CLIENT_H_
#define GOOGLE_BREAKPAD_CLIENT_MAC_CRASH_GENERATION_CRASH_GENERATION_CLIENT_H_

#include "common/mac/MachIPC.h"

#include <os/lock.h>

#include <memory>
#include <string>

namespace google_breakpad {

class CrashGenerationClient {
 public:
  explicit CrashGenerationClient(const char* mach_port_name)
    : sync_(OS_UNFAIR_LOCK_INIT),
      state_(State::Uninitialized),
      mach_port_name_(mach_port_name),
      sender_()
  {
    AsynchronousInitialization();
  }

  // Request the crash server to generate a dump.
  //
  // Return true if the dump was successful; false otherwise.
  bool RequestDumpForException(int exception_type,
			       int exception_code,
			       int64_t exception_subcode,
			       mach_port_t crashing_thread,
			       mach_port_t crashing_task);

  bool RequestDump() {
    return RequestDumpForException(0, 0, 0, MACH_PORT_NULL, mach_task_self());
  }

 private:
  enum State {
    Uninitialized,
    Initializing,
    Initialized,
    Failed,
  };

  os_unfair_lock sync_;
  State state_;
  std::string mach_port_name_;
  std::unique_ptr<MachPortSender> sender_;

  void AsynchronousInitialization();
  static void* AsynchronousInitializationThread(void* arg);
  void Initialization();
  bool WaitForInitialization();

  // Prevent copy construction and assignment.
  CrashGenerationClient(const CrashGenerationClient&);
  CrashGenerationClient& operator=(const CrashGenerationClient&);
};

}  // namespace google_breakpad

#endif  // GOOGLE_BREAKPAD_CLIENT_MAC_CRASH_GENERATION_CRASH_GENERATION_CLIENT_H_
