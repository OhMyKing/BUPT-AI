from setuptools import setup, Extension
from setuptools.command.build_ext import build_ext
import sys
import os
import setuptools
import subprocess


class get_pybind_include(object):
    """延迟导入pybind11直到它被实际安装，以便可以调用get_include()方法"""

    def __init__(self, user=False):
        self.user = user

    def __str__(self):
        import pybind11
        return pybind11.get_include(self.user)


def get_opencv_info():
    try:
        opencv_inc = subprocess.check_output(['pkg-config', '--cflags', 'opencv4']).decode('utf-8').strip()
        opencv_libs = subprocess.check_output(['pkg-config', '--libs', 'opencv4']).decode('utf-8').strip()

        # 移除-I和-L前缀并分割成列表
        inc_paths = [p[2:] for p in opencv_inc.split() if p.startswith('-I')]
        lib_paths = [p[2:] for p in opencv_libs.split() if p.startswith('-L')]
        libs = [p[2:] for p in opencv_libs.split() if p.startswith('-l')]

        return inc_paths, lib_paths, libs
    except (subprocess.SubprocessError, FileNotFoundError):
        return ['/usr/include/opencv4'], ['/usr/lib'], ['opencv_core', 'opencv_imgproc']


# 获取OpenCV路径
opencv_inc_paths, opencv_lib_paths, opencv_libs = get_opencv_info()

# 定义扩展模块
ext_modules = [
    Extension(
        'my_canny',
        sources=['python_bindings.cpp', 'canny.cpp'],
        include_dirs=[
            get_pybind_include(),
            get_pybind_include(user=True),
            *opencv_inc_paths
        ],
        library_dirs=opencv_lib_paths,
        libraries=opencv_libs,
        language='c++',
        extra_compile_args=['-std=c++14', '-fopenmp'],
        extra_link_args=['-fopenmp'],
    ),
]

if sys.platform == 'darwin':  # macOS
    # 检查Homebrew安装的libomp
    brew_libomp = '/opt/homebrew/opt/libomp'
    if not os.path.exists(brew_libomp):
        brew_libomp = '/usr/local/opt/libomp'

    if os.path.exists(brew_libomp):
        for ext in ext_modules:
            ext.include_dirs.append(f'{brew_libomp}/include')
            ext.library_dirs.append(f'{brew_libomp}/lib')
            ext.extra_compile_args = ['-Xpreprocessor', '-fopenmp'] + [x for x in ext.extra_compile_args if
                                                                       x != '-fopenmp']
            ext.extra_link_args = [f'{brew_libomp}/lib/libomp.dylib'] + [x for x in ext.extra_link_args if
                                                                         x != '-fopenmp']


def has_flag(compiler, flagname):
    import tempfile
    with tempfile.NamedTemporaryFile('w', suffix='.cpp') as f:
        f.write('int main (int argc, char **argv) { return 0; }')
        try:
            compiler.compile([f.name], extra_postargs=[flagname])
        except setuptools.distutils.errors.CompileError:
            return False
    return True


def cpp_flag(compiler):
    """返回-std=c++[11/14/17]编译器标志
    当可用时，更新版本优先于c++11"""
    flags = ['-std=c++17', '-std=c++14', '-std=c++11']

    for flag in flags:
        if has_flag(compiler, flag):
            return flag

    raise RuntimeError('不支持的编译器 -- 至少需要C++11支持！')


class BuildExt(build_ext):
    c_opts = {
        'msvc': ['/EHsc'],
        'unix': [],
    }
    l_opts = {
        'msvc': [],
        'unix': [],
    }

    if sys.platform == 'darwin':
        darwin_opts = ['-stdlib=libc++', '-mmacosx-version-min=10.7']
        c_opts['unix'] += darwin_opts
        l_opts['unix'] += darwin_opts

    def build_extensions(self):
        ct = self.compiler.compiler_type
        opts = self.c_opts.get(ct, [])
        link_opts = self.l_opts.get(ct, [])
        if ct == 'unix':
            opts.append('-DVERSION_INFO="%s"' % self.distribution.get_version())
            opts.append(cpp_flag(self.compiler))
            if has_flag(self.compiler, '-fvisibility=hidden'):
                opts.append('-fvisibility=hidden')
        elif ct == 'msvc':
            opts.append('/DVERSION_INFO=\\"%s\\"' % self.distribution.get_version())
        for ext in self.extensions:
            ext.extra_compile_args += opts
            ext.extra_link_args += link_opts
        build_ext.build_extensions(self)


setup(
    name='my_canny',
    version='0.1.0',
    author='Canny Developer',
    author_email='dev@example.com',
    description='Optimized Canny edge detection',
    long_description='',
    ext_modules=ext_modules,
    install_requires=['pybind11>=2.6.0', 'numpy'],
    cmdclass={'build_ext': BuildExt},
    zip_safe=False,
    python_requires='>=3.6',
)