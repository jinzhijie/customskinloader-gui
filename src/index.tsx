import assign from 'lodash.assign'
import React from 'react'
import ReactDOM from 'react-dom'
import injectTapEventPlugin from 'react-tap-event-plugin'

import AppBar from 'material-ui/AppBar'
import Dialog from 'material-ui/Dialog'
import FlatButton from 'material-ui/FlatButton'
import RaisedButton from 'material-ui/RaisedButton'
import Snackbar from 'material-ui/Snackbar'

import getMuiTheme from 'material-ui/styles/getMuiTheme'
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider'

import { Grid, Row, Cell } from 'react-inline-grid'
import Highlight from 'highlight.js'
import 'highlight.js/styles/github.css'

import CSLOptions from './components/CSLOptions'
import LoadList from './components/LoadList'
import SkinSiteEdit from './components/SkinSiteProfileEditor/SkinSiteEdit'
import CSLConfig from './config-handler'


type SkinSiteProfile = CSLConfig.MojangAPI
  | CSLConfig.CustomSkinAPI
  | CSLConfig.UniSkinAPI
  | CSLConfig.Legacy
  | CSLConfig.ElfSkin
  | CSLConfig.CustomSkinAPIPlus

const muiTheme = getMuiTheme()
injectTapEventPlugin()

interface AppProps {
  cslConfig: CSLConfig.CSLConfig
  isParseJsonFailed: boolean
  lastDeleted?: {
    index: number
    profile: CSLConfig.API
  }
  skinSiteDeleted: boolean
  profileEdit: SkinSiteProfile
  profileEditIndex: number
  isNewProfile: boolean
}

class App extends React.Component<{}, AppProps> {
  private fileInputElement: HTMLInputElement
  constructor() {
    super()

    this.state = {
      cslConfig: {
        enable: true,
        enableSkull: false,
        enableDynamicSkull: false,
        enableTransparentSkin: false,
        ignoreHttpsCertificate: false,
        enableUpdateSkull: false,
        enableLocalProfileCache: false,
        enableCacheAutoClean: false,
        cacheExpiry: 0,
        version: '',
        loadlist: []
      },
      isParseJsonFailed: false,
      skinSiteDeleted: false,
      profileEdit: { type: 'CustomSkinAPI', name: '', root: '' },
      profileEditIndex: 0,
      isNewProfile: true
    }

    Highlight.initHighlightingOnLoad()
  }

  componentDidUpdate () {
    Highlight.highlightBlock(ReactDOM.findDOMNode(this.refs.jsonResult))
  }

  downloadFile () {
    const downloadLink = document.createElement('a')
    downloadLink.href = `data:application/json,${encodeURI(this.generateJson())}`
    downloadLink.download = 'CustomSkinLoader.json'
    downloadLink.click()
  }

  chooseFile () {
    this.fileInputElement = document.createElement('input')
    this.fileInputElement.type = 'file'
    this.fileInputElement.onchange = event => {
      const fileReader = new FileReader()
      fileReader.onload = event => {
        try {
          const json = JSON.parse(event.target['result'])
          this.setState({ cslConfig: json, profileEditIndex: json.loadlist.length })
        } catch (error) {
          this.setState({ isParseJsonFailed: true })
        }
      }
      const files = event.target['files']
      if (files && files.length !== 0) {
        fileReader.readAsText(files[0])
      }
    }
    this.fileInputElement.click()
  }

  undoSkinSiteDeletion () {
    this.setState({ skinSiteDeleted: false })
    if (this.state.lastDeleted) {
      const loadList = this.state.cslConfig.loadlist
      loadList.splice(this.state.lastDeleted.index, 0, this.state.lastDeleted.profile)
      this.setState({ cslConfig: assign({}, this.state.cslConfig, { loadlist: loadList }) })
    }
  }

  generateJson () {
    const cslConfig = this.state.cslConfig
    cslConfig.loadlist = this.state.cslConfig.loadlist.map(item => {
      const newItem = {}
      for (const key in item) {
        if (item[key] !== '' && item[key] !== false && item[key] !== 'default') {
          newItem[key] = item[key]
        }
      }
      return (newItem as CSLConfig.API)
    })
    return JSON.stringify(cslConfig, null, 4)
  }

  render () {
    return (
      <MuiThemeProvider muiTheme={muiTheme}>
        <div>
          <AppBar
            title="CustomSkinLoader GUI"
            showMenuIconButton={false}
            iconElementRight={
              <div>
                <RaisedButton label="打开配置文件" secondary={true} onClick={e => this.chooseFile()} />
              </div>
            }
          />
          <Grid>
            <Row>
              <Cell is="3 tablet-12 phone-12">
                <CSLOptions
                  style={{ marginTop: '10px', marginLeft: '10px', width: '85%' }}
                  enable={this.state.cslConfig.enable}
                  enableSkull={this.state.cslConfig.enableSkull}
                  enableDynamicSkull={this.state.cslConfig.enableDynamicSkull}
                  enableTransparentSkin={this.state.cslConfig.enableTransparentSkin}
                  ignoreHttpsCertificate={this.state.cslConfig.ignoreHttpsCertificate}
                  enableUpdateSkull={this.state.cslConfig.enableUpdateSkull}
                  enableLocalProfileCache={this.state.cslConfig.enableLocalProfileCache}
                  enableCacheAutoClean={this.state.cslConfig.enableCacheAutoClean}
                  cacheExpiry={this.state.cslConfig.cacheExpiry}
                  onChange={(property, value: boolean | number) => {
                    this.setState({ cslConfig: assign({}, this.state.cslConfig, { [property]: value }) })
                  }}
                />
                <LoadList
                  names={this.state.cslConfig.loadlist.map(item => item.name)}
                  onDeleteItem={index => {
                    const loadList = this.state.cslConfig.loadlist
                    this.setState({ lastDeleted: { index: index, profile: loadList[index] } })
                    loadList.splice(index, 1)
                    this.setState({
                      cslConfig: assign({}, this.state.cslConfig, { loadlist: loadList }),
                      skinSiteDeleted: true,
                      profileEdit: { name: '', type: 'CustomSkinAPI', root: '', userAgent: '' },
                      isNewProfile: true,
                      profileEditIndex: loadList.length
                    })
                  }}
                  onEditItem={index => this.setState({
                    profileEdit: this.state.cslConfig.loadlist[index],
                    isNewProfile: false,
                    profileEditIndex: index
                  })}
                ></LoadList>
              </Cell>
              <Cell is="3 tablet-12 phone-12">
                <SkinSiteEdit
                  profile={this.state.profileEdit}
                  isNewProfile={this.state.isNewProfile}
                  onChange={profile => this.setState({ profileEdit: profile })}
                  onSubmit={() => {
                    const index = this.state.profileEditIndex
                    const loadList = this.state.cslConfig.loadlist
                    loadList[index] = this.state.profileEdit
                    this.setState({
                      cslConfig: assign({}, this.state.cslConfig, { loadlist: loadList }),
                      profileEdit: { name: '', type: 'CustomSkinAPI', root: '', userAgent: '' },
                      isNewProfile: true,
                      profileEditIndex: loadList.length
                    })
                  }}
                />
              </Cell>
              <Cell is="5 tablet-12 phone-12">
                <div style={{ marginTop: '5px' }}>
                  <RaisedButton label="点我下载" onClick={() => this.downloadFile()}></RaisedButton>
                  <span style={{ marginLeft: '5px' }}>也可以直接复制下面的结果</span>
                  <pre><code ref="jsonResult" className="json">{this.generateJson()}</code></pre>
                </div>
              </Cell>
            </Row>
          </Grid>

          {/* Other Components */}
          <Dialog
            open={this.state.isParseJsonFailed}
            actions={[
              <FlatButton
                label="好的"
                primary={true}
                onClick={() => this.setState({ isParseJsonFailed: false })}
              ></FlatButton>
            ]}
          >这不是一个有效的 CustomSkinLoader 配置文件，请重新选择
          </Dialog>

          <Snackbar
            open={this.state.skinSiteDeleted}
            message={this.state.lastDeleted ? `已删除 ${this.state.lastDeleted.profile.name}` : ''}
            autoHideDuration={3000}
            action="撤销"
            onActionTouchTap={event => this.undoSkinSiteDeletion()}
            onRequestClose={event => this.setState({ skinSiteDeleted: false })}
          ></Snackbar>
        </div>
      </MuiThemeProvider>
    )
  }
}

ReactDOM.render(<App />, document.getElementById('app'))