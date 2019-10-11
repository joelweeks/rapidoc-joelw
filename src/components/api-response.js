import { LitElement, html } from 'lit-element';
import marked from 'marked';
import { unsafeHTML } from 'lit-html/directives/unsafe-html';
import { schemaInObjectNotation, generateExample } from '@/utils/common-utils';
import FontStyles from '@/styles/font-styles';
import FlexStyles from '@/styles/flex-styles';
import TableStyles from '@/styles/table-styles';
import InputStyles from '@/styles/input-styles';
import '@/components/schema-tree';

export default class ApiResponse extends LitElement {
  constructor() {
    super();
    this.selectedStatus = '';
    this.headersForEachRespStatus = {};
    this.mimeResponsesForEachStatus = {};
  }

  render() {
    return html`
    ${FontStyles}
    ${FlexStyles}
    ${TableStyles}
    ${InputStyles}
    <style>
      .title{
        font-family:var(--font-regular);
        font-size:var(--title-font-size);
        font-weight:bold;
        margin-bottom:8px;
      }
      .resp-head{
        vertical-align: middle;
        padding:16px 0 8px;
      }
      .resp-head.divider{
        border-top: 1px solid var(--border-color);
        margin-top:10px;
      }
      .resp-status{ 
        font-weight:bold;
        font-size:calc(var(--small-font-size) + 1px);
      }
      .resp-descr{
        font-size:calc(var(--small-font-size) + 1px);
        color:var(--light-fg);
      }
      .top-gap{margin-top:16px;}
      .tab-buttons{
        height:30px;
        border-bottom: 1px solid var(--light-border-color) ;
        align-items: stretch;
      }
      .tab-btn{
        color:var(--fg);
        border:none;
        background-color:transparent;
        cursor:pointer;
        padding:1px;
        outline:none;
        font-size:var(--small-font-size);
        margin-right:16px;
        padding:1px;
      }
      .tab-btn.active{
        border-bottom: 3px solid var(--primary-color);
        font-weight:bold;
        color:var(--primary-color);
      }

      .tab-btn:hover{
        color:var(--primary-color);
      }
      .tab-content{
        margin:-1px 0 0 0;
      }
      .descr-text{
        color:var(--light-fg);
        font-family:var(--font-regular);
      }
    </style>
    <div class="col regular-font response-panel">
      <div class="title">RESPONSE</div>
      ${this.responseTemplate()}
    </div>  
    `;
  }

  static get properties() {
    return {
      responses: { type: Object },
      parser: { type: Object },
    };
  }

  /* eslint-disable indent */
  responseTemplate() {
    if (!this.responses) { return ''; }
    for (const statusCode in this.responses) {
      if (!this.selectedStatus) {
        this.selectedStatus = statusCode;
      }
      const allMimeResp = {};
      for (const mimeResp in this.responses[statusCode].content) {
        const mimeRespObj = this.responses[statusCode].content[mimeResp];

        // Generate Schema
        const schemaTree = schemaInObjectNotation(mimeRespObj.schema, {});

        // Generate Example
        const respExample = generateExample(
          mimeRespObj.examples ? mimeRespObj.examples : '',
          mimeRespObj.example ? mimeRespObj.example : '',
          mimeRespObj.schema,
          mimeResp,
          true,
          mimeResp.includes('json') ? 'json' : 'text',
        );
        allMimeResp[mimeResp] = {
          description: this.responses[statusCode].description,
          examples: respExample,
          schemaTree,
        };
      }
      // Headers for each response status
      const tempHeaders = [];
      for (const key in this.responses[statusCode].headers) {
        tempHeaders.push({ name: key, ...this.responses[statusCode].headers[key] });
      }
      this.headersForEachRespStatus[statusCode] = tempHeaders;
      this.mimeResponsesForEachStatus[statusCode] = allMimeResp;
    }

    return html`
      ${Object.keys(this.responses).length > 1
        ? html`<div class='row'>
          ${Object.keys(this.responses).map((status, index) => html`
          <button 
            @click="${() => this.changeSelectedStatus(status)}}"
            class='m-btn small ${this.selectedStatus === status ? 'primary' : ''}' 
            style='margin: 8px 4px 0 0'> ${status} </button>
          `)}`
        : ''
      }  
      </div>

      ${Object.keys(this.responses).map((status, index) => html`
        <div style = 'display: ${status === this.selectedStatus ? 'block' : 'none'}' >
          <div class="resp-head ${index === 0 ? 'top-gap' : 'divider'}">
            <span class="resp-status">${status}:</span> 
            <span class="resp-descr">${this.responses[status].description}</span> 
            ${(this.headersForEachRespStatus[status] && this.headersForEachRespStatus[status].length > 0)
              ? html`
                <div style="padding:12px 0 5px 0" class="resp-status">Response Headers:</div> 
                <table>
                  ${this.headersForEachRespStatus[status].map((v) => html`
                    <tr>
                      <td style="padding:0 12px;vertical-align: top;" class="regular-font-size"> ${v.name}</td> 
                      <td style="padding:0 12px;vertical-align: top; line-height:14px" class="descr-text small-font-size">
                        <span class="m-markdown-small">${unsafeHTML(marked(v.description || ''))}</span>
                        ${(v.schema && v.schema.example) ? html`<br/><span style="font-weight:bold">EXAMPLE:</span> ${v.schema.example}` : ''}
                      </td>
                    </tr>
                  `)}
                </table>`
              : ''
            }
          </div>

          ${Object.keys(this.mimeResponsesForEachStatus[status]).map(
            (mimeType) => (mimeType.includes('octet-stream')
              ? html`
                <div> 
                  <span style='color:var(--primary-color)'> Content-Type: </span> 
                  ${mimeType} (Binary Data) 
                </div>`
              : html`
                <div class="tab-panel col" style="border-width:0; min-height:200px">
                  <div id="${status}_${mimeType}_tab-buttons" @click="${this.activateTab}" class="tab-buttons row" >
                    <button class="tab-btn active" content_id="${status}_${mimeType}_example">EXAMPLE</button>
                    <button class="tab-btn" content_id="${status}_${mimeType}_model">MODEL</button>
                    <div style="flex:1"></div>
                    <div style="align-self:center;font-size:var(--small-font-size);"> ${mimeType} </div>
                  </div>
                  <div id="${status}_${mimeType}_example" class="tab-content col" style="flex:1; ">
                    ${this.mimeResponsesForEachStatus[status][mimeType].examples[0].exampleFormat === 'json'
                      ? html`
                        <json-tree 
                          class="border tree" 
                          .data="${this.mimeResponsesForEachStatus[status][mimeType].examples[0].exampleValue}"
                        ></json-tree>`
                      : html`
                        <pre style="font-size:var(--font-mono-size);">${this.mimeResponsesForEachStatus[status][mimeType].examples[0].exampleValue}</pre>
                      `
                    }
                  </div>
                  <div id="${status}_${mimeType}_model" class="tab-content col" style="flex:1;display:none">
                    <schema-tree 
                      class="border tree" 
                      .data="${this.mimeResponsesForEachStatus[status][mimeType].schemaTree}"
                    ></schema-tree>
                  </div>
                </div>
              `),
            )
          }
        </div>
      `)}
    `;
  }

  responseMimeTemplate() {

  }
  /* eslint-enable indent */

  changeSelectedStatus(status) {
    this.selectedStatus = status;
    this.requestUpdate();
  }

  activateTab(e) {
    if (e.target.classList.contains('active') || e.target.classList.contains('tab-btn') === false) {
      return;
    }
    const activeTabBtn = e.currentTarget.parentNode.querySelector('.tab-btn.active');
    activeTabBtn.classList.remove('active');
    e.target.classList.add('active');
    const showContentElsId = e.target.attributes.content_id.value;
    const allContentEls = e.currentTarget.parentNode.querySelectorAll('.tab-content');
    if (showContentElsId) {
      allContentEls.forEach((v) => {
        v.style.display = v.attributes.id.value === showContentElsId ? 'flex' : 'none';
      });
    }
  }
}

// Register the element with the browser
customElements.define('api-response', ApiResponse);
