<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="增强模型名称" prop="enhancementModelName">
        <el-input
          v-model="queryParams.enhancementModelName"
          placeholder="请输入增强模型名称"
          clearable
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="模型参数量" prop="modelParams">
        <el-input
          v-model="queryParams.modelParams"
          placeholder="请输入模型参数量"
          clearable
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="模型厂商" prop="modelVendor">
        <el-input
          v-model="queryParams.modelVendor"
          placeholder="请输入模型厂商"
          clearable
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="API状态" prop="apiStatus">
        <el-select v-model="queryParams.apiStatus" placeholder="请选择API状态" clearable>
          <el-option
            v-for="dict in dict.type.api_state"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="API额度" prop="apiQuota">
        <el-input
          v-model="queryParams.apiQuota"
          placeholder="请输入API额度"
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
          v-hasPermi="['admim_api:enhanceinfo:add']"
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
          v-hasPermi="['admim_api:enhanceinfo:edit']"
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
          v-hasPermi="['admim_api:enhanceinfo:remove']"
        >删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="el-icon-download"
          size="mini"
          @click="handleExport"
          v-hasPermi="['admim_api:enhanceinfo:export']"
        >导出</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="enhanceinfoList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="API编号" align="center" prop="enhancementApiId" />
      <el-table-column label="增强模型名称" align="center" prop="enhancementModelName" />
      <el-table-column label="模型参数量" align="center" prop="modelParams" />
      <el-table-column label="模型厂商" align="center" prop="modelVendor" />
      <el-table-column label="补充信息" align="center" prop="additionalInfo" />
      <el-table-column label="API状态" align="center" prop="apiStatus">
        <template slot-scope="scope">
          <dict-tag :options="dict.type.api_state" :value="scope.row.apiStatus"/>
        </template>
      </el-table-column>
      <el-table-column label="API额度" align="center" prop="apiQuota" />
      <el-table-column label="API密钥" align="center" prop="apiKey" />
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
        <template slot-scope="scope">
          <el-button
            size="mini"
            type="text"
            icon="el-icon-edit"
            @click="handleUpdate(scope.row)"
            v-hasPermi="['admim_api:enhanceinfo:edit']"
          >修改</el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-delete"
            @click="handleDelete(scope.row)"
            v-hasPermi="['admim_api:enhanceinfo:remove']"
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

    <!-- 添加或修改增强API管理对话框 -->
    <el-dialog :title="title" :visible.sync="open" width="500px" append-to-body>
      <el-form ref="form" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="增强模型名称" prop="enhancementModelName">
          <el-input v-model="form.enhancementModelName" placeholder="请输入增强模型名称" />
        </el-form-item>
        <el-form-item label="模型参数量" prop="modelParams">
          <el-input v-model="form.modelParams" placeholder="请输入模型参数量" />
        </el-form-item>
        <el-form-item label="模型厂商" prop="modelVendor">
          <el-input v-model="form.modelVendor" placeholder="请输入模型厂商" />
        </el-form-item>
        <el-form-item label="补充信息" prop="additionalInfo">
          <el-input v-model="form.additionalInfo" type="textarea" placeholder="请输入内容" />
        </el-form-item>
        <el-form-item label="API状态" prop="apiStatus">
          <el-radio-group v-model="form.apiStatus">
            <el-radio
              v-for="dict in dict.type.api_state"
              :key="dict.value"
              :label="parseInt(dict.value)"
            >{{dict.label}}</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="API额度" prop="apiQuota">
          <el-input v-model="form.apiQuota" placeholder="请输入API额度" />
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
import { listEnhanceinfo, getEnhanceinfo, delEnhanceinfo, addEnhanceinfo, updateEnhanceinfo } from "@/api/admim_api/enhanceinfo";

export default {
  name: "Enhanceinfo",
  dicts: ['api_state'],
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
      // 增强API管理表格数据
      enhanceinfoList: [],
      // 弹出层标题
      title: "",
      // 是否显示弹出层
      open: false,
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        enhancementModelName: null,
        modelParams: null,
        modelVendor: null,
        additionalInfo: null,
        apiStatus: null,
        apiQuota: null,
      },
      // 表单参数
      form: {},
      // 表单校验
      rules: {
        enhancementModelName: [
          { required: true, message: "增强模型名称不能为空", trigger: "blur" }
        ],
        modelParams: [
          { required: true, message: "模型参数量不能为空", trigger: "blur" }
        ],
        apiStatus: [
          { required: true, message: "API状态不能为空", trigger: "change" }
        ],
        apiQuota: [
          { required: true, message: "API额度不能为空", trigger: "blur" }
        ],
        apiKey: [
          { required: true, message: "API密钥不能为空", trigger: "blur" }
        ]
      }
    };
  },
  created() {
    this.getList();
  },
  methods: {
    /** 查询增强API管理列表 */
    getList() {
      this.loading = true;
      listEnhanceinfo(this.queryParams).then(response => {
        this.enhanceinfoList = response.rows;
        this.total = response.total;
        this.loading = false;
      });
    },
    // 取消按钮
    cancel() {
      this.open = false;
      this.reset();
    },
    // 表单重置
    reset() {
      this.form = {
        enhancementApiId: null,
        enhancementModelName: null,
        modelParams: null,
        modelVendor: null,
        additionalInfo: null,
        apiStatus: null,
        apiQuota: null,
        apiKey: null
      };
      this.resetForm("form");
    },
    /** 搜索按钮操作 */
    handleQuery() {
      this.queryParams.pageNum = 1;
      this.getList();
    },
    /** 重置按钮操作 */
    resetQuery() {
      this.resetForm("queryForm");
      this.handleQuery();
    },
    // 多选框选中数据
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.enhancementApiId)
      this.single = selection.length!==1
      this.multiple = !selection.length
    },
    /** 新增按钮操作 */
    handleAdd() {
      this.reset();
      this.open = true;
      this.title = "添加增强API管理";
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset();
      const enhancementApiId = row.enhancementApiId || this.ids
      getEnhanceinfo(enhancementApiId).then(response => {
        this.form = response.data;
        this.open = true;
        this.title = "修改增强API管理";
      });
    },
    /** 提交按钮 */
    submitForm() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          if (this.form.enhancementApiId != null) {
            updateEnhanceinfo(this.form).then(response => {
              this.$modal.msgSuccess("修改成功");
              this.open = false;
              this.getList();
            });
          } else {
            addEnhanceinfo(this.form).then(response => {
              this.$modal.msgSuccess("新增成功");
              this.open = false;
              this.getList();
            });
          }
        }
      });
    },
    /** 删除按钮操作 */
    handleDelete(row) {
      const enhancementApiIds = row.enhancementApiId || this.ids;
      this.$modal.confirm('是否确认删除增强API管理编号为"' + enhancementApiIds + '"的数据项？').then(function() {
        return delEnhanceinfo(enhancementApiIds);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {});
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('admim_api/enhanceinfo/export', {
        ...this.queryParams
      }, `enhanceinfo_${new Date().getTime()}.xlsx`)
    }
  }
};
</script>
