import React, { useState, useEffect } from "react";
import { useRef, useContext } from "react";
import "./HeaderMenu.css";
import "bootstrap/dist/css/bootstrap.min.css";
import { Navbar, Nav, NavDropdown, Col } from "react-bootstrap";
import { AutomataContext } from "./AutomataContext.js";
import { params } from './Regex';

function HeaderMenu(props) {
  
  const master_context = useContext(AutomataContext);

  const runbutton = useRef();

  const DFA = useRef();
  const NFA = useRef();
  const PDA = useRef();
  const CFG = useRef();
  const REG = useRef();

  useEffect(() => {
      const navLink = document.querySelector("a.dropdown-toggle.nav-link");
      if (navLink) {
          navLink.style.color = "#e25b4b";
      }
      master_context.mode = machine_select;

    if (
      master_context.mode == "Context-free Grammar" ||
      master_context.mode == "Turing Machine" ||
      master_context.mode == "Regular Expressions"
    )
    {
      
      runbutton.current.style.visibility = "hidden";
    } 
    else {
      runbutton.current.style.visibility = "visible";
    }
  });

  const [machine_select, set_machine_title] = useState(
      params.mode === 'dfa' ? "DFA" :
          params.mode === 'nfa' ? "NFA" :
              params.mode === 'cfg' ? "CFG" :
                  params.mode === 'pda' ? "PDA" :
                      params.mode === 'reg' ? "REG" :
                          "DFA" // 设置默认值，如果没有匹配到任何条件
  );

  const help =(
      params.mode === 'dfa' ? "点击鼠标左键以设置状态，按下T后连接两个状态以设置转移，点击转移以设置转移条件，按下按钮设置初始与终止状态。按下D后点击以删除状态或转移。完成后点击镌刻以提交。" :
          params.mode === 'nfa' ? "点击鼠标左键以设置状态，按下T后连接两个状态以设置转移，点击转移以设置转移条件，按下按钮设置初始与终止状态。按下D后点击以删除状态或转移。完成后点击镌刻以提交。" :
              params.mode === 'cfg' ? "点击左侧加号以添加文法规则，点击镌刻以提交请求。" :
                  params.mode === 'pda' ? "点击鼠标左键以设置状态，按下T后连接两个状态以设置转移，点击转移以设置转移条件，按下按钮设置初始与终止状态。按下D后点击以删除状态或转移。完成后点击镌刻以提交。" :
                      params.mode === 'reg' ? "请输入表达式" :
                          "点击鼠标左键以设置状态，按下T后连接两个状态以设置转移，点击转移以设置转移条件，按下按钮设置初始与终止状态。按下D后点击以删除状态或转移。完成后点击镌刻以提交。" // 设置默认值，如果没有匹配到任何条件
  );

  function nav_menu_dropdown_click(e, machine) {
        let name = machine["current"].text === 'Deterministic Finite Automata' ? "DFA" :
        machine["current"].text === ' Non-Deterministic Finite Automata' ? "NFA" :
            machine["current"].text === 'Context-free Grammar' ? "CFG" :
                machine["current"].text === 'Push-down Automata' ? "PDA" :
                    machine["current"].text === 'Regular Expressions' ? "RE" :
                        'DFA' // 设置默认值，如果没有匹配到任何条件
    if (master_context.sidebarOpen) {
      runbutton.current.click()
    }
    set_machine_title(name);
    master_context.mode = name;
  }
  return (
    <Navbar bg="primary" className="bg-dark" id="nav-header">
      <Col md={1}></Col>
      <Col md={4} >
          <Col>{help}</Col>
      </Col>
      <Col md={2}>
        <Col>{machine_select}</Col>
      </Col>
      <Navbar.Toggle aria-controls="responsive-navbar-nav" />
      <Col md={2}></Col>
      <Navbar.Collapse id="responsive-navbar-nav">
        <Nav className="mr-auto">
            {params.mode === '' && (
                <NavDropdown
                    className="nav-dropdown-text"
                    title="Machines"
                    id="collasible-nav-dropdown"
                >
                    <NavDropdown.Item
                        id="DFA"
                        onClick={event => nav_menu_dropdown_click(event, DFA)}
                        ref={DFA}
                        href=""
                    >
                        Deterministic Finite Automata{""}
                    </NavDropdown.Item>
                    <NavDropdown.Item
                        id="REG"
                        onClick={event => nav_menu_dropdown_click(event, REG)}
                        ref={REG}
                        href=""
                    >
                        Regular Expressions{""}
                    </NavDropdown.Item>

                    <NavDropdown.Item
                        id="NFA"
                        onClick={event => nav_menu_dropdown_click(event, NFA)}
                        ref={NFA}
                        href=""
                    >
                        {" "}
                        Non-Deterministic Finite Automata{""}
                    </NavDropdown.Item>
                    <NavDropdown.Item
                        id="CFG"
                        onClick={event => nav_menu_dropdown_click(event, CFG)}
                        ref={CFG}
                        href=""
                    >
                        Context-free Grammar
                    </NavDropdown.Item>
                    <NavDropdown.Item
                        id="PDA"
                        onClick={event => nav_menu_dropdown_click(event, PDA)}
                        ref={PDA}
                        href=""
                    >
                        Push-down Automata
                    </NavDropdown.Item>
                </NavDropdown>
            )}
            <Col></Col>
          <Nav>
            <Nav.Link
              ref={runbutton}
              href=""
              class="text-primary"
              id="runbutton"
            >
              Run
            </Nav.Link>

            <Col></Col>
          </Nav>
        </Nav>

      </Navbar.Collapse>
    </Navbar>
  );
}

export default HeaderMenu;
