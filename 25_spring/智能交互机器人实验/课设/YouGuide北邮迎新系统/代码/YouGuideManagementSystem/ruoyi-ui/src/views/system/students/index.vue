<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="学号" prop="studentNum">
        <el-input
          v-model="queryParams.studentNum"
          placeholder="请输入学号"
          clearable
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="姓名" prop="name">
        <el-input
          v-model="queryParams.name"
          placeholder="请输入姓名"
          clearable
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="性别" prop="gender">
        <el-select v-model="queryParams.gender" placeholder="请选择性别" clearable>
          <el-option
            v-for="dict in dict.type.gender"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="学院" prop="college">
        <el-select v-model="queryParams.college" placeholder="请选择学院" clearable>
          <el-option
            v-for="dict in dict.type.college"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="专业" prop="major">
        <el-input
          v-model="queryParams.major"
          placeholder="请输入专业"
          clearable
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="宿舍楼" prop="dormitoryId">
        <el-select v-model="queryParams.dormitoryId" placeholder="请选择宿舍楼" clearable>
          <el-option
            v-for="dict in dict.type.dormitory"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="宿舍号" prop="dormitoryNo">
        <el-input
          v-model="queryParams.dormitoryNo"
          placeholder="请输入宿舍号"
          clearable
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="电话" prop="phone">
        <el-input
          v-model="queryParams.phone"
          placeholder="请输入电话"
          clearable
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="微信" prop="wechatEnterpriseId">
        <el-input
          v-model="queryParams.wechatEnterpriseId"
          placeholder="请输入微信"
          clearable
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="报道进度" prop="flowPositionId">
        <el-select v-model="queryParams.flowPositionId" placeholder="请选择报道进度" clearable>
          <el-option
            v-for="dict in dict.type.flow_positions"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="当前经度" prop="currentLatitude">
        <el-input
          v-model="queryParams.currentLatitude"
          placeholder="请输入当前经度"
          clearable
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="当前纬度" prop="currentLongitude">
        <el-input
          v-model="queryParams.currentLongitude"
          placeholder="请输入当前纬度"
          clearable
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
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
          v-hasPermi="['system:students:add']"
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
          v-hasPermi="['system:students:edit']"
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
          v-hasPermi="['system:students:remove']"
        >删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="el-icon-download"
          size="mini"
          @click="handleExport"
          v-hasPermi="['system:students:export']"
        >导出</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="studentsList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
<!--      <el-table-column label="学生ID" align="center" prop="studentId" />-->
      <el-table-column label="学号" align="center" prop="studentNum" />
      <el-table-column label="姓名" align="center" prop="name" />
      <el-table-column label="性别" align="center" prop="gender">
        <template slot-scope="scope">
          <dict-tag :options="dict.type.gender" :value="scope.row.gender"/>
        </template>
      </el-table-column>
      <el-table-column label="学院" align="center" prop="college">
        <template slot-scope="scope">
          <dict-tag :options="dict.type.college" :value="scope.row.college"/>
        </template>
      </el-table-column>
      <el-table-column label="专业" align="center" prop="major" />
      <el-table-column label="宿舍楼" align="center" prop="dormitoryId">
        <template slot-scope="scope">
          <dict-tag :options="dict.type.dormitory" :value="scope.row.dormitoryId"/>
        </template>
      </el-table-column>
      <el-table-column label="宿舍号" align="center" prop="dormitoryNo" />
      <el-table-column label="电话" align="center" prop="phone" />
      <el-table-column label="微信" align="center" prop="wechatEnterpriseId" />
      <el-table-column label="报道进度" align="center" prop="flowPositionId">
        <template slot-scope="scope">
          <dict-tag :options="dict.type.flow_positions" :value="scope.row.flowPositionId"/>
        </template>
      </el-table-column>
      <el-table-column label="当前经度" align="center" prop="currentLatitude" />
      <el-table-column label="当前纬度" align="center" prop="currentLongitude" />
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
        <template slot-scope="scope">
          <el-button
            size="mini"
            type="text"
            icon="el-icon-edit"
            @click="handleUpdate(scope.row)"
            v-hasPermi="['system:students:edit']"
          >修改</el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-delete"
            @click="handleDelete(scope.row)"
            v-hasPermi="['system:students:remove']"
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

    <!-- 添加或修改新生管理对话框 -->
    <el-dialog :title="title" :visible.sync="open" width="500px" append-to-body>
      <el-form ref="form" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="学号" prop="studentNum">
          <el-input v-model="form.studentNum" placeholder="请输入学号" />
        </el-form-item>
        <el-form-item label="姓名" prop="name">
          <el-input v-model="form.name" placeholder="请输入姓名" />
        </el-form-item>
        <el-form-item label="性别" prop="gender">
          <el-radio-group v-model="form.gender">
            <el-radio
              v-for="dict in dict.type.gender"
              :key="dict.value"
              :label="dict.value"
            >{{dict.label}}</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="学院" prop="college">
          <el-select v-model="form.college" placeholder="请选择学院">
            <el-option
              v-for="dict in dict.type.college"
              :key="dict.value"
              :label="dict.label"
              :value="dict.value"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="专业" prop="major">
          <el-input v-model="form.major" placeholder="请输入专业" />
        </el-form-item>
        <el-form-item label="宿舍楼" prop="dormitoryId">
          <el-select v-model="form.dormitoryId" placeholder="请选择宿舍楼">
            <el-option
              v-for="dict in dict.type.dormitory"
              :key="dict.value"
              :label="dict.label"
              :value="parseInt(dict.value)"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="宿舍号" prop="dormitoryNo">
          <el-input v-model="form.dormitoryNo" placeholder="请输入宿舍号" />
        </el-form-item>
        <el-form-item label="电话" prop="phone">
          <el-input v-model="form.phone" placeholder="请输入电话" />
        </el-form-item>
        <el-form-item label="微信" prop="wechatEnterpriseId">
          <el-input v-model="form.wechatEnterpriseId" placeholder="请输入微信" />
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
import { listStudents, getStudents, delStudents, addStudents, updateStudents } from "@/api/system/students"

export default {
  name: "Students",
  dicts: ['college', 'gender', 'dormitory', 'flow_positions'],
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
      // 新生管理表格数据
      studentsList: [],
      // 弹出层标题
      title: "",
      // 是否显示弹出层
      open: false,
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        studentNum: null,
        name: null,
        gender: null,
        college: null,
        major: null,
        dormitoryId: null,
        dormitoryNo: null,
        phone: null,
        wechatEnterpriseId: null,
        flowPositionId: null,
        currentLatitude: null,
        currentLongitude: null
      },
      // 表单参数
      form: {},
      // 表单校验
      rules: {
        studentId: [
          { required: true, message: "学生ID不能为空", trigger: "blur" }
        ],
        studentNum: [
          { required: true, message: "学号不能为空", trigger: "blur" }
        ],
        name: [
          { required: true, message: "姓名不能为空", trigger: "blur" }
        ],
        gender: [
          { required: true, message: "性别不能为空", trigger: "change" }
        ],
        college: [
          { required: true, message: "学院不能为空", trigger: "change" }
        ],
        major: [
          { required: true, message: "专业不能为空", trigger: "blur" }
        ],
        dormitoryId: [
          { required: true, message: "宿舍楼不能为空", trigger: "change" }
        ],
        phone: [
          { required: true, message: "电话不能为空", trigger: "blur" }
        ],
        wechatEnterpriseId: [
          { required: true, message: "微信不能为空", trigger: "blur" }
        ],
      }
    }
  },
  created() {
    this.getList()
  },
  methods: {
    /** 查询新生管理列表 */
    getList() {
      this.loading = true
      listStudents(this.queryParams).then(response => {
        this.studentsList = response.rows
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
        studentId: null,
        studentNum: null,
        name: null,
        gender: null,
        college: null,
        major: null,
        dormitoryId: null,
        dormitoryNo: null,
        phone: null,
        wechatEnterpriseId: null,
        flowPositionId: null,
        currentLatitude: null,
        currentLongitude: null
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
      this.ids = selection.map(item => item.studentId)
      this.single = selection.length!==1
      this.multiple = !selection.length
    },
    /** 新增按钮操作 */
    handleAdd() {
      this.reset()
      this.open = true
      this.title = "添加新生管理"
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset()
      const studentId = row.studentId || this.ids
      getStudents(studentId).then(response => {
        this.form = response.data
        this.open = true
        this.title = "修改新生管理"
      })
    },
    /** 提交按钮 */
    submitForm() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          if (this.form.studentId != null) {
            updateStudents(this.form).then(response => {
              this.$modal.msgSuccess("修改成功")
              this.open = false
              this.getList()
            })
          } else {
            addStudents(this.form).then(response => {
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
      const studentIds = row.studentId || this.ids
      this.$modal.confirm('是否确认删除新生管理编号为"' + studentIds + '"的数据项？').then(function() {
        return delStudents(studentIds)
      }).then(() => {
        this.getList()
        this.$modal.msgSuccess("删除成功")
      }).catch(() => {})
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('system/students/export', {
        ...this.queryParams
      }, `students_${new Date().getTime()}.xlsx`)
    }
  }
}
</script>
