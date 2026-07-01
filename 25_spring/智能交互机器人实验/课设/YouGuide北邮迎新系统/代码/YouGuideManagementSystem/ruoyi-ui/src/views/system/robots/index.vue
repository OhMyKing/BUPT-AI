<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="68px">
<!--      <el-form-item label="电量" prop="batteryLevel">-->
<!--        <el-input-->
<!--          v-model="queryParams.batteryLevel"-->
<!--          placeholder="请输入电量"-->
<!--          clearable-->
<!--          @keyup.enter.native="handleQuery"-->
<!--        />-->
<!--      </el-form-item>-->
      <el-form-item label="状态" prop="healthStateId">
        <el-select v-model="queryParams.healthStateId" placeholder="请选择状态" clearable>
          <el-option
            v-for="dict in dict.type.health_states"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="类型" prop="robotTypeId">
        <el-select v-model="queryParams.robotTypeId" placeholder="请选择类型" clearable>
          <el-option
            v-for="dict in dict.type.robot_types"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="当前纬度" prop="currentLatitude">
        <el-input
          v-model="queryParams.currentLatitude"
          placeholder="请输入当前纬度"
          clearable
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="当前经度" prop="currentLongitude">
        <el-input
          v-model="queryParams.currentLongitude"
          placeholder="请输入当前经度"
          clearable
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="目标维度" prop="targetLatitude">
        <el-input
          v-model="queryParams.targetLatitude"
          placeholder="请输入目标维度"
          clearable
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="目标经度" prop="targetLongitude">
        <el-input
          v-model="queryParams.targetLongitude"
          placeholder="请输入目标经度"
          clearable
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="目标地点" prop="targetPositionId">
        <el-input
          v-model="queryParams.targetPositionId"
          placeholder="请输入目标地点"
          clearable
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="流程进度" prop="flowPositionId">
        <el-input
          v-model="queryParams.flowPositionId"
          placeholder="请输入流程进度"
          clearable
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="跟随新生" prop="followingStudentId">
        <el-input
          v-model="queryParams.followingStudentId"
          placeholder="请输入跟随新生"
          clearable
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="通信地址" prop="communicationUrl">
        <el-input
          v-model="queryParams.communicationUrl"
          placeholder="请输入通信地址"
          clearable
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
<!--      <el-form-item label="控制秘钥" prop="controlKey">-->
<!--        <el-input-->
<!--          v-model="queryParams.controlKey"-->
<!--          placeholder="请输入控制秘钥"-->
<!--          clearable-->
<!--          @keyup.enter.native="handleQuery"-->
<!--        />-->
<!--      </el-form-item>-->
      <el-form-item>
        <el-button type="primary" icon="el-icon-search" size="mini" @click="handleQuery">搜索</el-button>
        <el-button icon="el-icon-refresh" size="mini" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button
          type="primary"
          plain
          icon="el-icon-plus"
          size="mini"
          @click="handleAdd"
          v-hasPermi="['system:robots:add']"
        >新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="success"
          plain
          icon="el-icon-edit"
          size="mini"
          :disabled="single"
          @click="handleUpdate"
          v-hasPermi="['system:robots:edit']"
        >修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="danger"
          plain
          icon="el-icon-delete"
          size="mini"
          :disabled="multiple"
          @click="handleDelete"
          v-hasPermi="['system:robots:remove']"
        >删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="el-icon-download"
          size="mini"
          @click="handleExport"
          v-hasPermi="['system:robots:export']"
        >导出</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="robotsList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="机器人ID" align="center" prop="robotId" />
      <el-table-column label="电量" align="center" prop="batteryLevel" />
      <el-table-column label="状态" align="center" prop="healthStateId">
        <template slot-scope="scope">
          <dict-tag :options="dict.type.health_states" :value="scope.row.healthStateId"/>
        </template>
      </el-table-column>
      <el-table-column label="类型" align="center" prop="robotTypeId">
        <template slot-scope="scope">
          <dict-tag :options="dict.type.robot_types" :value="scope.row.robotTypeId"/>
        </template>
      </el-table-column>
      <el-table-column label="当前纬度" align="center" prop="currentLatitude" />
      <el-table-column label="当前经度" align="center" prop="currentLongitude" />
      <el-table-column label="目标维度" align="center" prop="targetLatitude" />
      <el-table-column label="目标经度" align="center" prop="targetLongitude" />
      <el-table-column label="目标地点" align="center" prop="targetPositionId">
        <template slot-scope="scope">
          <dict-tag :options="dict.type.key_positions" :value="scope.row.targetPositionId"/>
        </template>
      </el-table-column>
      <el-table-column label="流程进度" align="center" prop="flowPositionId">
        <template slot-scope="scope">
          <dict-tag :options="dict.type.flow_positions" :value="scope.row.flowPositionId"/>
        </template>
      </el-table-column>
      <el-table-column label="跟随新生" align="center" prop="followingStudentId" />
      <el-table-column label="通信地址" align="center" prop="communicationUrl" />
      <el-table-column label="控制秘钥" align="center" prop="controlKey" />
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
        <template slot-scope="scope">
          <el-button
            size="mini"
            type="text"
            icon="el-icon-edit"
            @click="handleUpdate(scope.row)"
            v-hasPermi="['system:robots:edit']"
          >修改</el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-delete"
            @click="handleDelete(scope.row)"
            v-hasPermi="['system:robots:remove']"
          >删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination
      v-show="total>0"
      :total="total"
      :page.sync="queryParams.pageNum"
      :limit.sync="queryParams.pageSize"
      @pagination="getList"
    />

    <!-- 添加或修改机器人管理对话框 -->
    <el-dialog :title="title" :visible.sync="open" width="500px" append-to-body>
      <el-form ref="form" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="类型" prop="robotTypeId">
          <el-select v-model="form.robotTypeId" placeholder="请选择类型">
            <el-option
              v-for="dict in dict.type.robot_types"
              :key="dict.value"
              :label="dict.label"
              :value="parseInt(dict.value)"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="通信地址" prop="communicationUrl">
          <el-input v-model="form.communicationUrl" placeholder="请输入通信地址" />
        </el-form-item>
        <el-form-item label="控制秘钥" prop="controlKey">
          <el-input v-model="form.controlKey" placeholder="请输入控制秘钥" />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="submitForm">确 定</el-button>
        <el-button @click="cancel">取 消</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { listRobots, getRobots, delRobots, addRobots, updateRobots } from "@/api/system/robots"

export default {
  name: "Robots",
  dicts: ['robot_types', 'health_states'],
  data() {
    return {
      // 遮罩层
      loading: true,
      // 选中数组
      ids: [],
      // 非单个禁用
      single: true,
      // 非多个禁用
      multiple: true,
      // 显示搜索条件
      showSearch: true,
      // 总条数
      total: 0,
      // 机器人管理表格数据
      robotsList: [],
      // 弹出层标题
      title: "",
      // 是否显示弹出层
      open: false,
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        batteryLevel: null,
        healthStateId: null,
        robotTypeId: null,
        currentLatitude: null,
        currentLongitude: null,
        targetLatitude: null,
        targetLongitude: null,
        targetPositionId: null,
        flowPositionId: null,
        followingStudentId: null,
        communicationUrl: null,
        controlKey: null
      },
      // 表单参数
      form: {},
      // 表单校验
      rules: {
        batteryLevel: [
          { required: true, message: "电量不能为空", trigger: "blur" }
        ],
        healthStateId: [
          { required: true, message: "状态不能为空", trigger: "change" }
        ],
        robotTypeId: [
          { required: true, message: "类型不能为空", trigger: "change" }
        ],
        currentLatitude: [
          { required: true, message: "当前纬度不能为空", trigger: "blur" }
        ],
        currentLongitude: [
          { required: true, message: "当前经度不能为空", trigger: "blur" }
        ],
        communicationUrl: [
          { required: true, message: "通信地址不能为空", trigger: "blur" }
        ],
        controlKey: [
          { required: true, message: "控制秘钥不能为空", trigger: "blur" }
        ]
      }
    }
  },
  created() {
    this.getList()
  },
  methods: {
    /** 查询机器人管理列表 */
    getList() {
      this.loading = true
      listRobots(this.queryParams).then(response => {
        this.robotsList = response.rows
        this.total = response.total
        this.loading = false
      })
    },
    // 取消按钮
    cancel() {
      this.open = false
      this.reset()
    },
    // 表单重置
    reset() {
      this.form = {
        robotId: null,
        batteryLevel: null,
        healthStateId: null,
        robotTypeId: null,
        currentLatitude: null,
        currentLongitude: null,
        targetLatitude: null,
        targetLongitude: null,
        targetPositionId: null,
        flowPositionId: null,
        followingStudentId: null,
        communicationUrl: null,
        controlKey: null
      }
      this.resetForm("form")
    },
    /** 搜索按钮操作 */
    handleQuery() {
      this.queryParams.pageNum = 1
      this.getList()
    },
    /** 重置按钮操作 */
    resetQuery() {
      this.resetForm("queryForm")
      this.handleQuery()
    },
    // 多选框选中数据
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.robotId)
      this.single = selection.length!==1
      this.multiple = !selection.length
    },
    /** 新增按钮操作 */
    handleAdd() {
      this.reset()
      this.open = true
      this.title = "添加机器人管理"
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset()
      const robotId = row.robotId || this.ids
      getRobots(robotId).then(response => {
        this.form = response.data
        this.open = true
        this.title = "修改机器人管理"
      })
    },
    /** 提交按钮 */
    submitForm() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          if (this.form.robotId != null) {
            updateRobots(this.form).then(response => {
              this.$modal.msgSuccess("修改成功")
              this.open = false
              this.getList()
            })
          } else {
            addRobots(this.form).then(response => {
              this.$modal.msgSuccess("新增成功")
              this.open = false
              this.getList()
            })
          }
        }
      })
    },
    /** 删除按钮操作 */
    handleDelete(row) {
      const robotIds = row.robotId || this.ids
      this.$modal.confirm('是否确认删除机器人管理编号为"' + robotIds + '"的数据项？').then(function() {
        return delRobots(robotIds)
      }).then(() => {
        this.getList()
        this.$modal.msgSuccess("删除成功")
      }).catch(() => {})
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('system/robots/export', {
        ...this.queryParams
      }, `robots_${new Date().getTime()}.xlsx`)
    }
  }
}
</script>
