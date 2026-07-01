import React, { useEffect, useState, useRef, useContext, } from "react";
import RowInput from "./RowInput.js";
import {
  Card,
  Accordion,
  Col,
  Row,
  InputGroup,
  Button,
  FormControl,
  Table,
  OverlayTrigger,
  Tooltip,
  Badge,
  Form,
} from "react-bootstrap";
import add_perfect from "./plus.svg";
import error_image from "./error.svg";
import success_image from "./success.svg";
import idle_svg from "./button.svg";
import  Popup  from "reactjs-popup";
import { AutomataContext } from "./AutomataContext.js";

// 解析URL参数
function getURLParameters() {
  const params = {};
  window.location.search.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m, key, value) {
    value = decodeURIComponent(value);
    if (key === "exam_data") {
      // 如果键为exam_data，处理为数组
      if (params.hasOwnProperty(key)) {
        params[key].push(value);
      } else {
        params[key] = [value];
      }
    } else if (key === "mode") {
      // 如果键为mode，处理为字符串（始终使用最后一个值）
      params[key] = value;
    } else {
      // 对于其他参数，如果已存在，则更新为新值；如果不存在，则初始化为字符串
      params[key] = value;
    }
  });
  console.log(params);
  return params;
}



export const params = getURLParameters();

let inputValForExport;
let userTranslatedRegex;
let result = false;
const image_collection = [error_image, idle_svg, success_image];
const exam_data_RE =  params.exam_data;
function Regex() {
  useRef(null);
  let input_reg = useRef(null);
  useContext(AutomataContext);
  const [warningDisplay, setWarningDisplay] = useState({ exception: false, message: null })
  const [displayWarning] = useState(false)
  const inputRowCollector = useRef(null);
  const [testRows, setTestRows] = useState([1])
  const [exportModal, setExportModal] = useState(false)
  useEffect(() => {
    return () => {
    }
  });
  const make_reg = (str_ar) => {
    str_ar = str_ar.replace(/\s+/g, '');
    let reg;
    try {
      while (str_ar.includes("!")) {
        str_ar = str_ar.replace("!", "");
      }
      reg = new RegExp("^(" + str_ar + ")$", "g");
    }
    catch (err) {
      setWarningDisplay({ exception: true, message: err.message.replace("(", "").replace("^", "").replace("/", "").replace("$", "").replace("/", "") });
    }
    userTranslatedRegex = reg
    return reg
  }
 
  const HTMLCol_to_array = (html_collection) =>
    Array.prototype.slice.call(html_collection);

  const WarningSign = (props) => {
    return <Badge variant="danger"> {props.message}</Badge>;
      
  };

  const examInputs = (event) => {
    setWarningDisplay({ exception: false, message: "" })
    let userInputRowCollection = exam_data_RE;
    let inputRaw = input_reg.current.value;
    const reg = make_reg(inputRaw);
    result = userInputRowCollection.some(str => str.match(reg));
    console.log("result:",result)
    if(result){
      window.top.postMessage(result, '*');
    }
    let ans =[
      ...Array(HTMLCol_to_array(inputRowCollector.current.children).length),
    ];
    ans.fill(1);
    setTestRows([...ans])
  };

  const testInputs = (event) => {
    setWarningDisplay({ exception: false, message: "" })
    let userInputRowCollection = [
      ...Array(HTMLCol_to_array(inputRowCollector.current.children).length),
    ];
    HTMLCol_to_array(inputRowCollector.current.children).map((row_node, ind) => {
      let arrayOfHtml = HTMLCol_to_array(row_node.children)
      for (let i = 0; i < arrayOfHtml.length; i++) {
        let perRow = 3;
        userInputRowCollection[ind * perRow + i] = arrayOfHtml[i].children[1].value
      }
    })
    let inputRaw = input_reg.current.value;
    const reg = make_reg(inputRaw);
    let ans = userInputRowCollection.map((str, i) => {
      if (str.match(reg)) {
        return 2
      }
      return 0
    })
    setTestRows([...ans])
  };

  const addTestRow = () => {
    if (testRows.length == 24) {
      return
    }
    let newArr = [...testRows, 1]
    setTestRows([...newArr])
  }
  const layRows = () => {
    const consInputRow = (key, isCorrect) => {
      return (<RowInput key={key}
        image={image_collection[isCorrect]}
        flip={true} />)
    }
    const consRow = (inputRows) => {
      if (inputRows == false) {
        return
      }
      return (<Row>
        {inputRows.map((input, key) => (input))}
      </Row>)
    }
    const perRow = 3;
    const counter = perRow;
    let rowsAccum = []
    let finalRows = []
    for (let i = 1; i < testRows.length + 1; i++) {
      rowsAccum.push(consInputRow(i - 1, testRows[i - 1]))
      if (i % counter == 0) {
        finalRows.push(consRow(rowsAccum))
        rowsAccum = []
      }
    }
    if (rowsAccum.length != 0)
      finalRows.push(consRow(rowsAccum))
    return finalRows
  }
  return (
      <div id="row_container_reg">
            <Popup
        open={exportModal}
        onClose={() => {
          setExportModal(false);
        }}
      >
        <div>
          {displayWarning ? (
            <WarningSign message="Enter: name@uic.edu"/>
          ) : (
            <React.Fragment></React.Fragment>
          )}
          <InputGroup className="mb-2b">
            <Form.Control
              type="text"
              onChange={(text) => {
                inputValForExport = text.target.value
              }}
            />
          </InputGroup>
        </div>
      </Popup>
      <Row>
        <Col md={{ offset: 1, span: 10 }}>
          <Accordion className="accord_rules" defaultActiveKey="0">
            <Card>
              <OverlayTrigger
                delay={{ show: 150, hide: 200 }}
                overlay={<Tooltip>Click </Tooltip>}
              >
                <Accordion.Toggle as={Card.Header} eventKey="0">
                  操作
                </Accordion.Toggle>
              </OverlayTrigger>
              <Accordion.Collapse eventKey="0">
                <Card.Body>
                  <Table bordered hover>
                    <tbody>
                    <tr>
                        <td>
                          !
                        </td>
                        <td> 空串 ε	 </td>
                      </tr>
                      <tr>
                        <td>*</td>
                        <td>克林闭包</td>
                      </tr>
                      <tr>
                        <td>+</td>
                        <td>正闭包</td>
                      </tr>
                      <tr>
                        <td>( . . . )</td>
                        <td>字符组</td>
                      </tr>
                      <tr>
                        <td>𝚎𝚡𝚙 | 𝚎𝚡𝚙
                        </td>
                        <td>左表达式或右表达式</td>
                      </tr>

                    </tbody>
                  </Table>
                </Card.Body>
              </Accordion.Collapse>
            </Card>
          </Accordion>
        </Col>
      </Row>
      {warningDisplay.exception ? (
          <WarningSign message={warningDisplay.message}/>
          ) : (
            <React.Fragment></React.Fragment>
          )}
      <Row className="mt-4">
        <Col md={{ offset: 3, span: 6 }}>
          <InputGroup>
          
            <InputGroup.Prepend>
              <Button variant="info" id ="api_button" onClick={examInputs}>镌刻</Button>

            </InputGroup.Prepend>
            <InputGroup.Prepend>
 
            </InputGroup.Prepend>
            <FormControl ref={input_reg} placeholder="aa*" />
            <InputGroup.Append>
              <Button variant="info" id ="api_button" onClick={testInputs}>测试</Button>
            </InputGroup.Append>

             <Col md={{ offset: 0, span: 1 }}> 
              <input
              id="add_button"
              onClick={(event) => addTestRow(event)}
              type="image"
              src={add_perfect}
              width="33"
              height="33"
              name="add_row_input"
            />
            </Col>
          </InputGroup>

        </Col>
      </Row>
      <Row className="row mt-4">
        <Col ref={inputRowCollector} md={{offset: 1,span:10}}>      {layRows().map((jsx, _) =>
        (jsx)
      )}
</Col>

      </Row>
    </div>
  );
}

export default Regex;
