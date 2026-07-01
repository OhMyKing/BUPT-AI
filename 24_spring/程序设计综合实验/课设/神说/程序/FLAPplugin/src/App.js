import React, { useEffect, useState, useRef, useCallback } from "react";
import Visual from "./Visual.js";
import HeaderMenu from "./HeaderMenu.js";
import { AutomataContext } from "./AutomataContext.js";
import Run from "./Run.js";
import Sidebar from "react-sidebar";
import PDA_Visual from "./PDA_Visual.js";
import CFG_Visual from "./CFG_Visual.js";
import Regex, {params} from "./Regex.js";
import "bootstrap/dist/css/bootstrap.min.css";
import "./Regex.css";

import { v4 as uuidv4 } from 'uuid';
let master_context = {
  graphObj: null,
  grammar_obj: [{TERM:"",NON_TERM:""}],
  pushdown: false,
};
const CURRENT_MACHINE = {
  DFA: 0,
  NFA: 1,
  CFG: 2,
  TM: 3,
  PDA:4,
  REG:5
};

function App() {
  window.onload = function () {
    master_context.session = uuidv4();
    master_context.date = new Date();
   }

  const [sidebar_display, set_sidebar_display] = useState(false);
  

  const [machine_displayed, set_machine_displayed] = useState(
      params.mode === 'dfa' ? CURRENT_MACHINE.DFA :
          params.mode === 'nfa' ? CURRENT_MACHINE.NFA :
              params.mode === 'cfg' ? CURRENT_MACHINE.CFG :
                  params.mode === 'pda' ? CURRENT_MACHINE.PDA :
                      params.mode === 'reg' ? CURRENT_MACHINE.REG :
                          CURRENT_MACHINE.DFA // 设置默认值，如果没有匹配到任何条件
  );
  let lock_run_button = false;


  const render_sidebar_callback = useCallback(display_lock => {
    master_context.sidebarOpen = display_lock;
    set_sidebar_display(display_lock);
  }, []);

  const click_run_handler = e => {
    if (e.target.lastChild == null) {
      return;
    }
    e.preventDefault();

    let target_check = e.target.lastChild.data;

    if (
      target_check === "Run" &&
      sidebar_display === false &&
      !lock_run_button
    ) {
      lock_run_button = true;
      render_sidebar_callback(true);
    } else if (
      target_check === "Run" &&
      sidebar_display === true &&
      !lock_run_button
    ) {
      lock_run_button = true;
      render_sidebar_callback(false);
    }
  };


  useEffect(() => {
    window.addEventListener("click", e => {
      
      if(e.target.id === "temp_anchor" || e.hotkeyApplication) return;
      e.preventDefault();

      // menu handler
      if (e.target != null) {
        if(e.target.id === "DFA"){
          set_machine_displayed(CURRENT_MACHINE.DFA);

        }
        else if(e.target.id === "NFA"){
          set_machine_displayed(CURRENT_MACHINE.NFA);

        }
        else if (e.target.id === "CFG") {
          set_machine_displayed(CURRENT_MACHINE.CFG);
        }
        else if(e.target.id === "PDA"){
          set_machine_displayed(CURRENT_MACHINE.PDA);
        }
        else if(e.target.id === "TM"){
          set_machine_displayed(CURRENT_MACHINE.TM); 
        }
        else if(e.target.id === "REG"){
          set_machine_displayed(CURRENT_MACHINE.REG);
        }
      }

      click_run_handler(e);
      setTimeout(()=>{ },1)

    });
    return () => {
      
      window.removeEventListener("click", e => click_run_handler(e));
    };
  }, 
  [sidebar_display]);

  function render_machine_display(){
    switch (machine_displayed){
      case CURRENT_MACHINE.DFA:
        return <Visual />;
      case CURRENT_MACHINE.REG:
        return <Regex/>;
      case CURRENT_MACHINE.NFA:
        return <Visual />;
      case CURRENT_MACHINE.CFG:
        return <CFG_Visual/>;
      case CURRENT_MACHINE.PDA:
        return <PDA_Visual/>
      case CURRENT_MACHINE.TM:
        return <h1>Turing Machine! :(</h1>

    }
}

  return (
    <div className="App">
      <AutomataContext.Provider value={master_context}>
        {sidebar_display ? (
          <Sidebar
            id="sidebar-app"
            sidebar={<Run />}
            touch={false}
            children={<div></div>}
            defaultSidebarWidth={20}
            open={false}
            shadow={true}
            docked={true}
            styles={{
              sidebar: { background: "white", zIndex: 2 },
              overlay: { zIndex: 2 },
              content: { visibility: "hidden", zIndex: -112 },
              dragHandle: { zIndex: -500 }
            }}
          ></Sidebar>
        ) : null}
        <HeaderMenu />
        {render_machine_display()}
      </AutomataContext.Provider>
    </div>
  );
}

export default App;
